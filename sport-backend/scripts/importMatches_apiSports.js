// scripts/importMatches_apiSports.js
require("dotenv").config();
const pool = require("../db");
const axios = require("axios");

function mustEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const BASE = (process.env.API_FOOTBALL_BASE || process.env.API_SPORTS_BASE || "").replace(/\/+$/, "");
const KEY = process.env.API_SPORTS_KEY;
const SOURCE = "api_sports";

const api = axios.create({
  baseURL: BASE,
  headers: { "x-apisports-key": KEY },
  timeout: 20000,
});

async function ensureIndexes() {
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS matches_source_external_unique
    ON matches (source, external_id);
  `);
}

async function importFixtures({ league, season, tournamentId, durationMinutes = 90 }) {
  const { data } = await api.get("/fixtures", { params: { league, season } });
  const fixtures = Array.isArray(data?.response) ? data.response : [];

  console.log(
    `Fixtures received: ${fixtures.length} (league=${league}, season=${season}, tournamentId=${tournamentId})`
  );

  let inserted = 0;
  let skippedNoTeams = 0;
  let skippedBadData = 0;
  let errors = 0;

  for (const f of fixtures) {
    const fixtureId = String(f?.fixture?.id || "");
    const matchDate = f?.fixture?.date;

    const homeExternal = String(f?.teams?.home?.id || "");
    const awayExternal = String(f?.teams?.away?.id || "");

    if (!fixtureId || !matchDate || !homeExternal || !awayExternal) {
      skippedBadData++;
      continue;
    }

    const homeRes = await pool.query(
      `SELECT team_id FROM teams WHERE source=$1 AND external_id=$2 AND tournament_id=$3`,
      [SOURCE, homeExternal, tournamentId]
    );

    const awayRes = await pool.query(
      `SELECT team_id FROM teams WHERE source=$1 AND external_id=$2 AND tournament_id=$3`,
      [SOURCE, awayExternal, tournamentId]
    );

    if (homeRes.rowCount === 0 || awayRes.rowCount === 0) {
      skippedNoTeams++;
      continue;
    }

    const scoreHome = Number.isInteger(f?.goals?.home) ? f.goals.home : null;
    const scoreAway = Number.isInteger(f?.goals?.away) ? f.goals.away : null;

    try {
      await pool.query(
        `
        INSERT INTO matches
          (
            match_date,
            home_team_id,
            away_team_id,
            tournament_id,
            duration_minutes,
            score_home,
            score_away,
            source,
            external_id,
            season
          )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (source, external_id)
        DO UPDATE SET
          match_date = EXCLUDED.match_date,
          home_team_id = EXCLUDED.home_team_id,
          away_team_id = EXCLUDED.away_team_id,
          tournament_id = EXCLUDED.tournament_id,
          duration_minutes = EXCLUDED.duration_minutes,
          score_home = EXCLUDED.score_home,
          score_away = EXCLUDED.score_away,
          season = EXCLUDED.season
        `,
        [
          matchDate,
          homeRes.rows[0].team_id,
          awayRes.rows[0].team_id,
          tournamentId,
          durationMinutes,
          scoreHome,
          scoreAway,
          SOURCE,
          fixtureId,
          season,
        ]
      );

      inserted++;
    } catch (e) {
      errors++;
      console.log("❌ DB error:", e.message);
      console.log("fixtureId:", fixtureId, "home:", homeExternal, "away:", awayExternal);
    }
  }

  console.log("---- Import summary ----");
  console.log({ inserted, skippedNoTeams, skippedBadData, errors });
}

(async () => {
  try {
    mustEnv("API_SPORTS_KEY");
    if (!BASE) throw new Error("Missing API_SPORTS_BASE or API_FOOTBALL_BASE in .env");

    console.log("=== importMatches_apiSports START ===");
    console.log("BASE:", BASE);
    console.log("KEY exists:", Boolean(KEY));

    await ensureIndexes();

    const jobs = [
      { label: "Premier League", league: 39, seasons: [2023, 2024], tournamentId: 5 },
      { label: "La Liga", league: 140, seasons: [2023, 2024], tournamentId: 4 },
      { label: "Serie A", league: 135, seasons: [2023, 2024], tournamentId: 6 },
      { label: "Bundesliga", league: 78, seasons: [2023, 2024], tournamentId: 7 },
      { label: "Ligue 1", league: 61, seasons: [2023, 2024], tournamentId: 8 },
      { label: "Ukrainian Premier League", league: 333, seasons: [2023, 2024], tournamentId: 9 },
    ];

    for (const job of jobs) {
      for (const season of job.seasons) {
        console.log(`\n=== ${job.label} ${season} ===`);

        await importFixtures({
          league: job.league,
          season,
          tournamentId: job.tournamentId,
          durationMinutes: 90,
        });

        await new Promise((r) => setTimeout(r, 8000));
      }
    }

    console.log("✅ Done");
    process.exit(0);
  } catch (err) {
    console.error("Import error:", err.message);
    process.exit(1);
  }
})();