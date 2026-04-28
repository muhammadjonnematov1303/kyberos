const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const auth = require("../middleware/auth");

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

const safeUser = (user) => {
  const { password, ...rest } = user.toJSON();
  return rest;
};

// POST /api/auth/register
router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name min 2 chars"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password min 6 chars"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const { name, email, password } = req.body;

      const exists = await User.findOne({ where: { email } });
      if (exists) return res.status(409).json({ message: "Email already registered" });

      const hashed = await bcrypt.hash(password, 12);
      const user = await User.create({ name, email, password: hashed });

      const token = signToken(user.id);
      res.status(201).json({ token, user: safeUser(user) });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const { email, password } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(401).json({ message: "Invalid credentials" });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ message: "Invalid credentials" });

      const token = signToken(user.id);
      res.json({ token, user: safeUser(user) });
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// GET /api/auth/me
router.get("/me", auth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
