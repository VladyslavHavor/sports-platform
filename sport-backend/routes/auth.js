const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

function signToken(user) {
  const secret = process.env.JWT_SECRET || "dev_secret";
  return jwt.sign(
    { user_id: user.user_id, role: user.role, username: user.username },
    secret,
    { expiresIn: "7d" }
  );
}

// POST /auth/register { username, email, password }
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body || {};

    // ✅ NEW: field-level validation
    const errors = {};

    if (!username) errors.username = "Username required";
    if (!email) errors.email = "Email required";
    if (!password) errors.password = "Password required";

    if (email && (!email.includes("@") || !email.includes("."))) {
      errors.email = "Invalid email format";
    }

    if (username && username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    }

    if (password && password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (Object.keys(errors).length > 0) {
      // Повертаємо і старий формат error, і новий errors
      return res.status(400).json({
        error: "Validation error",
        errors,
      });
    }

    // ✅ NEW: check email exists (separate)
    const emailCheck = await pool.query(
      `SELECT 1 FROM users WHERE email = $1`,
      [email]
    );
    if (emailCheck.rows.length) {
      return res.status(409).json({
        error: "Email already exists",
        errors: { email: "Email already exists" },
      });
    }

    // ✅ NEW: check username exists (separate)
    const usernameCheck = await pool.query(
      `SELECT 1 FROM users WHERE username = $1`,
      [username]
    );
    if (usernameCheck.rows.length) {
      return res.status(409).json({
        error: "Username already exists",
        errors: { username: "Username already exists" },
      });
    }

    // (старий exists-запит лишаємо як "страховку", нічого не ламає)
    const exists = await pool.query(
      `SELECT 1 FROM users WHERE email = $1 OR username = $2`,
      [email, username]
    );
    if (exists.rows.length) return res.status(400).json({ error: "User already exists" });

    const password_hash = await bcrypt.hash(password, 10);

    const ins = await pool.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, 'user')
       RETURNING user_id, username, email, role`,
      [username, email, password_hash]
    );

    const user = ins.rows[0];
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/login { email, password }
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email, password required" });

    const q = await pool.query(
      `SELECT user_id, username, email, password_hash, role
       FROM users
       WHERE email = $1`,
      [email]
    );
    if (!q.rows.length) return res.status(400).json({ error: "Invalid credentials" });

    const user = q.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });

    const token = signToken(user);
    res.json({ token, user: { user_id: user.user_id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /auth/me
router.get("/me", auth, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const q = await pool.query(
      `SELECT user_id, username, email, role FROM users WHERE user_id = $1`,
      [userId]
    );
    res.json(q.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;