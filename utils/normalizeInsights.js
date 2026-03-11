/**
 * To Make sure that the API responses from Open API is safe
 * and doesnt drift causing FE issues
 */
function normalizeInsights(x = {}) {
  return {
    behavioral_insights: Array.isArray(x.behavioral_insights)
      ? x.behavioral_insights
      : [],
    root_cause_hypotheses: Array.isArray(x.root_cause_hypotheses)
      ? x.root_cause_hypotheses
      : [],
    micro_challenges: Array.isArray(x.micro_challenges)
      ? x.micro_challenges
      : [],
    risk_flags: Array.isArray(x.risk_flags) ? x.risk_flags : [],
    forecast:
      x.forecast && typeof x.forecast === "object"
        ? {
            title: x.forecast.title || "",
            message: x.forecast.message || "",
            assumption: x.forecast.assumption || "",
          }
        : { title: "", message: "", assumption: "" },
    next_best_move:
      x.next_best_move && typeof x.next_best_move === "object"
        ? {
            title: x.next_best_move.title || "",
            message: x.next_best_move.message || "",
            first_step_today: x.next_best_move.first_step_today || "",
          }
        : { title: "", message: "", first_step_today: "" },
  };
}
