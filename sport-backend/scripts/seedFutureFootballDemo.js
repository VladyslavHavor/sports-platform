require("dotenv").config();
const pool = require("../db");

const DEMO_SOURCE = "demo_football_2025";

const leagues = [
  { tournamentId: 5, name: "Premier League" },
  { tournamentId: 4, name: "La Liga" },
  { tournamentId: 6, name: "Serie A" },
  { tournamentId: 7, name: "Bundesliga" },
  { tournamentId: 8, name: "Ligue 1" },
  { tournamentId: 9, name: "Ukrainian Premier League" },
];

function dateMinutesFromNow(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

async function getTeams(tournamentId) {
  const { rows } = await pool.query(
    `
    SELECT team_id, name
    FROM teams
    WHERE tournament_id = $1
    ORDER BY team_id
    LIMIT 8
    `,
    [tournamentId]
  );

  return rows;
}

async function createMatch({
  tournamentId,
  homeTeamId,
  awayTeamId,
  matchDate,
  scoreHome,
  scoreAway,
  externalId,
}) {
  await pool.query(
    `
    INSERT INTO matches (
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
    VALUES ($1,$2,$3,$4,90,$5,$6,$7,$8,2025)
    ON CONFLICT (source, external_id)
    DO UPDATE SET
      match_date = EXCLUDED.match_date,
      score_home = EXCLUDED.score_home,
      score_away = EXCLUDED.score_away,
      season = EXCLUDED.season
    `,
    [
      matchDate,
      homeTeamId,
      awayTeamId,
      tournamentId,
      scoreHome,
      scoreAway,
      DEMO_SOURCE,
      externalId,
    ]
  );
}

async function seedLeague(league) {
  const teams = await getTeams(league.tournamentId);

  if (teams.length < 6) {
    console.log(`⚠️ ${league.name}: not enough teams`);
    return;
  }

  console.log(`⚽ Seeding ${league.name}`);

  const matches = [
    // LIVE — матч почався 35 хв тому
    {
      home: teams[0],
      away: teams[1],
      date: dateMinutesFromNow(-35),
      scoreHome: 1,
      scoreAway: 0,
      suffix: "live-1",
    },

    // LIVE — матч почався 70 хв тому
    {
      home: teams[2],
      away: teams[3],
      date: dateMinutesFromNow(-70),
      scoreHome: 2,
      scoreAway: 2,
      suffix: "live-2",
    },

    // Scheduled
    {
      home: teams[4],
      away: teams[5],
      date: dateMinutesFromNow(180),
      scoreHome: null,
      scoreAway: null,
      suffix: "scheduled-1",
    },

    {
      home: teams[6],
      away: teams[7],
      date: dateMinutesFromNow(1440),
      scoreHome: null,
      scoreAway: null,
      suffix: "scheduled-2",
    },

    // Finished demo
    {
      home: teams[1],
      away: teams[2],
      date: dateMinutesFromNow(-3000),
      scoreHome: 3,
      scoreAway: 1,
      suffix: "finished-1",
    },

    {
      home: teams[3],
      away: teams[4],
      date: dateMinutesFromNow(-4200),
      scoreHome: 0,
      scoreAway: 0,
      suffix: "finished-2",
    },
  ];

  for (const m of matches) {
    await createMatch({
      tournamentId: league.tournamentId,
      homeTeamId: m.home.team_id,
      awayTeamId: m.away.team_id,
      matchDate: m.date,
      scoreHome: m.scoreHome,
      scoreAway: m.scoreAway,
      externalId: `${league.tournamentId}-${m.suffix}`,
    });
  }
}

(async () => {
  try {
    console.log("🌱 Seeding football 2025/2026 demo...");

    await pool.query(`DELETE FROM matches WHERE source = $1`, [DEMO_SOURCE]);

    for (const league of leagues) {
      await seedLeague(league);
    }

    console.log("✅ Football demo season added!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err.message);
    process.exit(1);
  }
})();