// src/services/upsertTeams.js
const pool = require("../../db");

async function upsertTeam({ name, externalId, sportId }) {
  const source = process.env.DATA_SOURCE || "api_sports";
  const ext = String(externalId);

  // 1) Якщо вже є по (source, external_id) — просто апдейтимо
  const byExternal = await pool.query(
    `SELECT team_id FROM teams WHERE source=$1 AND external_id=$2`,
    [source, ext]
  );

  if (byExternal.rowCount > 0) {
    await pool.query(
      `UPDATE teams
       SET name=$1, sport_id=$2
       WHERE source=$3 AND external_id=$4`,
      [name, sportId, source, ext]
    );
    return;
  }

  // 2) Якщо є по (sport_id, name) — "приклеюємо" external_id + source
  const byName = await pool.query(
    `SELECT team_id FROM teams WHERE sport_id=$1 AND name=$2`,
    [sportId, name]
  );

  if (byName.rowCount > 0) {
    await pool.query(
      `UPDATE teams
       SET source=$1, external_id=$2
       WHERE team_id=$3`,
      [source, ext, byName.rows[0].team_id]
    );
    return;
  }

  // 3) Інакше — створюємо нову
  await pool.query(
    `INSERT INTO teams (sport_id, name, source, external_id)
     VALUES ($1, $2, $3, $4)`,
    [sportId, name, source, ext]
  );
}

module.exports = { upsertTeam };