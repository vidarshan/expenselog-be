import OpenAI from "openai";
import Insight from "../models/Insight.js";
import Transaction from "../models/Transaction.js";
import { buildMonthlySummary } from "../utils/buildMonthlySummary.js";
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is missing in environment variables");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const aiProfile = {
  tone: "tough-love", // "friendly" | "professional"
  goal: "save_more", // "reduce_discretionary" | "pay_debt" | "build_emergency_fund"
  riskTolerance: "medium", // "low" | "high"
  focusCategories: ["Food", "Entertainment"],
};

export const getInsights = async (req, res) => {
  try {
    const { month } = req.query;
    const userId = req.user?.id || req.user?._id || req.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!month) return res.status(400).json({ message: "Month is required" });
    const [year, monthNum] = month.split("-").map(Number);
    const startOfMonth = new Date(year, monthNum - 1, 1);
    const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59, 999);
    const existing = await Insight.findOne({ userId, month });
    if (existing) return res.json(existing.insights);

    const summary = await buildMonthlySummary(userId, month);

    const txCount = await Transaction.countDocuments({
      userId: req.userId,
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    });

    if (txCount < 10) {
      return res.status(200).json({
        status: "insufficient_data",
        required: 10,
        current: txCount,
        message: "At least 10 transactions are required to generate insights.",
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "financial_insights",
          schema: {
            type: "object",
            properties: {
              behavioral_insights: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    message: { type: "string" },
                    evidence: { type: "string" },
                  },
                  required: ["title", "message", "evidence"],
                },
              },
              root_cause_hypotheses: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    message: { type: "string" },
                    what_to_check_next: { type: "string" },
                  },
                  required: ["title", "message", "what_to_check_next"],
                },
              },
              micro_challenges: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    rules: { type: "array", items: { type: "string" } },
                    target: { type: "string" },
                    why: { type: "string" },
                  },
                  required: ["title", "rules", "target", "why"],
                },
              },
              risk_flags: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    message: { type: "string" },
                    severity: {
                      type: "string",
                      enum: ["low", "medium", "high"],
                    },
                  },
                  required: ["title", "message", "severity"],
                },
              },
              forecast: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  message: { type: "string" },
                  assumption: { type: "string" },
                },
                required: ["title", "message", "assumption"],
              },
              next_best_move: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  message: { type: "string" },
                  first_step_today: { type: "string" },
                },
                required: ["title", "message", "first_step_today"],
              },
            },
            required: [
              "behavioral_insights",
              "root_cause_hypotheses",
              "micro_challenges",
              "risk_flags",
              "forecast",
              "next_best_move",
            ],
          },
        },
      },
      messages: [
        {
          role: "system",
          content: `
You are a personalized financial coach inside an expense tracking app.

Hard rules:
- Speak in second person ("you").
- Add value BEYOND the dashboard. Avoid repeating totals like income/expenses/savings unless needed to support a deeper insight.
- Be specific and concise. Avoid generic advice.
- Do not mention categories that are not present in topCategories, categoryDeltas, repeatMerchants, anomalies, or last10Transactions.
- If evidence is weak, say so.
- Use ONLY the provided data as evidence. Do NOT assume categories (e.g., entertainment) exist unless present in the data.
- Do NOT say "check last 10 transactions" unless the data includes last10Transactions.
- Prefer: root-cause hypotheses, concentration/flexibility insights, risk exposure, next-best action, and a simple forecast scenario.
- Return strictly valid JSON only.
Tone must follow aiProfile.tone; prioritize aiProfile.goal; adjust strictness to aiProfile.riskTolerance; prioritize aiProfile.focusCategories.
`,
        },
        {
          role: "user",
          content: `
aiProfile:
${JSON.stringify(aiProfile, null, 2)}

Return STRICT JSON in exactly this shape:

{
  "behavioral_insights": [
    { "title": string, "message": string, "evidence": string }
  ],
  "root_cause_hypotheses": [
    { "title": string, "message": string, "what_to_check_next": string }
  ],
  "micro_challenges": [
    { "title": string, "rules": string[], "target": string, "why": string }
  ],
  "risk_flags": [
    { "title": string, "message": string, "severity": "low"|"medium"|"high" }
  ],
  "forecast": {
    "title": string,
    "message": string,
    "assumption": string
  },
  "next_best_move": {
    "title": string,
    "message": string,
    "first_step_today": string
  }
}

Financial summary (dashboard already shows totals — add NEW value beyond that):
${JSON.stringify(summary, null, 2)}
`,
        },
      ],
    });

    let parsed;
    try {
      parsed = JSON.parse(completion.choices[0].message.content);
    } catch {
      parsed = {
        behavioral_insights: [],
        root_cause_hypotheses: [],
        micro_challenges: [],
        risk_flags: [],
        forecast: {
          title: "Forecast unavailable",
          message: "We couldn't generate a forecast this time.",
          assumption: "N/A",
        },
        next_best_move: {
          title: "Next step unavailable",
          message: "We couldn't generate next steps this time.",
          first_step_today: "Try again later.",
        },
      };
    }

    // Normalize to avoid schema issues even if model slips
    const normalized = {
      behavioral_insights: Array.isArray(parsed.behavioral_insights)
        ? parsed.behavioral_insights
        : [],
      root_cause_hypotheses: Array.isArray(parsed.root_cause_hypotheses)
        ? parsed.root_cause_hypotheses
        : [],
      micro_challenges: Array.isArray(parsed.micro_challenges)
        ? parsed.micro_challenges
        : [],
      risk_flags: Array.isArray(parsed.risk_flags) ? parsed.risk_flags : [],
      forecast: parsed.forecast || null,
      next_best_move: parsed.next_best_move || null,
    };

    await Insight.create({ userId, month, insights: normalized });

    return res.json(normalized);
  } catch (err) {
    console.error("AI Insights Error:", err);
    return res.status(500).json({ message: "Failed to generate insights" });
  }
};
