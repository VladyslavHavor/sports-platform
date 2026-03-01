const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");

// GET /favorites -> список team_id
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const { rows } = await pool.query(
      `SELECT team_id FROM user_favorites WHERE user_id = $1 ORDER BY team_id`,
      [userId]
    );

    res.json(rows.map((r) => r.team_id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /favorites/:teamId -> додати в фаворити
router.post("/:teamId", auth, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const teamId = Number(req.params.teamId);

    await pool.query(
      `INSERT INTO user_favorites(user_id, team_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, teamId]
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /favorites/:teamId -> видалити з фаворитів
router.delete("/:teamId", auth, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const teamId = Number(req.params.teamId);

    await pool.query(
      `DELETE FROM user_favorites WHERE user_id=$1 AND team_id=$2`,
      [userId, teamId]
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;