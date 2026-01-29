const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.register = async (req, res) => {
  try {
    const { email, name, password, salary } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      email,
      username: name,
      password: hashedPassword,
      salary,
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Login failed" });
  }
};

exports.update = async (req, res) => {
  try {
    const { username, salary } = req.body;

    const updates = {};

    if (username) {
      updates.username = username.trim();
    }

    if (salary) {
      if (!salary.type || !["fixed", "variable"].includes(salary.type)) {
        return res.status(400).json({ message: "Invalid salary type" });
      }

      if (
        salary.type === "fixed" &&
        (!salary.fixed || typeof salary.fixed.amount !== "number")
      ) {
        return res
          .status(400)
          .json({ message: "Fixed salary amount required" });
      }

      if (
        salary.type === "variable" &&
        (!Array.isArray(salary.variable) || salary.variable.length === 0)
      ) {
        return res.status(400).json({ message: "Variable salaries required" });
      }

      updates.salary = salary;
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates }, //set values to given fields
      { new: true, runValidators: true }, //validate data
    ).select("-password");

    res.json(updatedUser);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Login failed" });
  }
};

exports.me = async (req, res) => {
  const user = await User.findById(req.userId).select("-password");
  res.json(user);
};
