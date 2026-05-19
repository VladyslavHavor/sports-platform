// scripts/importTeams_apiSports.js
require("dotenv").config();
const axios = require("axios");
const pool = require("../db");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getBaseUrl() {
  const base = process.env.API_SPORTS_BASE || process.env.API_FOOTBALL_BASE;
  if (!base) throw new Error("Missing API_SPORTS_BASE or API_FOOTBALL_BASE in .env");
  return String(base).replace(/\/+$/, "");
}

function getApiKey() {
  const key = process.env.API_SPORTS_KEY || process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error("Missing API_SPORTS_KEY (or API_FOOTBALL_KEY) in .env");
  return key;
}

async function importTeamsForLeague({ apiLeagueId, season, tournamentId, label }) {
  const baseURL = getBaseUrl();
  const apiKey = getApiKey();

  console.log(`\n--- Importing ${label} (apiLeagueId=${apiLeagueId}, season=${season}, tournamentId=${tournamentId}) ---`);

  const res = await axios.get(`${baseURL}/teams`, {
    params: { league: apiLeagueId, season },
    headers: { "x-apisports-key": apiKey },
    timeout: 20000,
  });

  const data = res.data;

  if (data?.errors && Object.keys(data.errors).length) {
    console.log("⚠️ API errors:", data.errors);
  }

  const rows = Array.isArray(data?.response) ? data.response : [];
  console.log(`API returned teams: ${rows.length}`);

  let upserted = 0;

  for (const item of rows) {
    const team = item.team || {};
    if (!team.id || !team.name) continue;

    const externalId = String(team.id);
    const name = String(team.name);
    const country = team.country ? String(team.country) : null;
    const logo = team.logo ? String(team.logo) : null;

    // ✅ головне: tournament_id вставляємо
    // ⚠️ у тебе унікальний constraint скоріш за все teams_sport_name_unique (sport_id, name)
    // тому робимо ON CONFLICT саме по ньому
    const q = `
  INSERT INTO teams (sport_id, name, country, logo, source, external_id, tournament_id)
  VALUES (1, $1, $2, $3, 'api_sports', $4, $5)
  ON CONFLICT ON CONSTRAINT teams_sport_name_unique
  DO UPDATE SET
    country = COALESCE(EXCLUDED.country, teams.country),
    logo = COALESCE(EXCLUDED.logo, teams.logo),
    source = EXCLUDED.source,
    external_id = EXCLUDED.external_id,
    tournament_id = EXCLUDED.tournament_id
  RETURNING team_id;
`;

    await pool.query(q, [name, country, logo, externalId, tournamentId]);
    upserted++;
  }

  console.log(`✅ ${label}: upserted ${upserted} teams`);
}

async function run() {
  console.log("=== importTeams_apiSports START ===");
  console.log("CWD:", process.cwd());
  console.log("BASE:", getBaseUrl());
  console.log("KEY exists:", Boolean(getApiKey()));

const seasons = [2023, 2024];


  const configs = [
    { label: "Premier League", apiLeagueId: 39, tournamentId: 5 },
    { label: "La Liga", apiLeagueId: 140, tournamentId: 4 },
    { label: "Serie A", apiLeagueId: 135, tournamentId: 6 },
    { label: "Bundesliga", apiLeagueId: 78, tournamentId: 7 },
    { label: "Ligue 1", apiLeagueId: 61, tournamentId: 8 },
     { label: "Ukrainian Premier League", apiLeagueId: 333, tournamentId: 9 },
  ];

 for (const season of seasons) {
  console.log(`\n========== SEASON ${season} ==========`);

  for (const cfg of configs) {
    await importTeamsForLeague({ ...cfg, season });
    await sleep(8000);
  }
}

  console.log("\n✅ DONE");
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ ERROR:", err.response?.data || err.message);
    process.exit(1);
  });