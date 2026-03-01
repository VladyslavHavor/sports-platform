const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

const matchesRoutes = require("./routes/matches");
const playersRoutes = require("./routes/players");
const tournamentsRoutes = require("./routes/tournaments");
const authRoutes = require("./routes/auth");
const favoritesRoutes = require("./routes/favorites");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Sports API is running 🚀"));

app.get("/health/db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() as now");
    res.json({ ok: true, now: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.use("/auth", authRoutes);
app.use("/favorites", favoritesRoutes);

app.use("/matches", matchesRoutes);
app.use("/players", playersRoutes);
app.use("/tournaments", tournamentsRoutes);

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));