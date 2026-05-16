require("dotenv").config();
const pool = require("../db");

async function ensureSport(name) {
  const existing = await pool.query(
    `SELECT sport_id FROM sports WHERE LOWER(name)=LOWER($1)`,
    [name]
  );

  if (existing.rows.length) {
    return existing.rows[0].sport_id;
  }

  const inserted = await pool.query(
    `INSERT INTO sports(name)
     VALUES($1)
     RETURNING sport_id`,
    [name]
  );

  return inserted.rows[0].sport_id;
}

async function createTournament(name, country, sportId) {
  const existing = await pool.query(
    `SELECT tournament_id
     FROM tournaments
     WHERE LOWER(name)=LOWER($1)
     LIMIT 1`,
    [name]
  );

  if (existing.rows.length) {
    return existing.rows[0].tournament_id;
  }

  const inserted = await pool.query(
    `INSERT INTO tournaments(name, country, sport_id)
     VALUES($1,$2,$3)
     RETURNING tournament_id`,
    [name, country, sportId]
  );

  return inserted.rows[0].tournament_id;
}

async function createTeam(name, tournamentId) {
  const tournament = await pool.query(
    `SELECT sport_id FROM tournaments WHERE tournament_id = $1`,
    [tournamentId]
  );

  const sportId = tournament.rows[0].sport_id;

  const existing = await pool.query(
    `SELECT team_id
     FROM teams
     WHERE LOWER(name)=LOWER($1)
     AND tournament_id=$2`,
    [name, tournamentId]
  );

  if (existing.rows.length) {
    return existing.rows[0].team_id;
  }

  const inserted = await pool.query(
    `INSERT INTO teams(name, tournament_id, sport_id)
     VALUES($1,$2,$3)
     RETURNING team_id`,
    [name, tournamentId, sportId]
  );

  return inserted.rows[0].team_id;
}

async function createMatch({
  homeTeamId,
  awayTeamId,
  tournamentId,
  date,
  homeScore,
  awayScore,
  status,
}) {
  await pool.query(
    `
    INSERT INTO matches(
      match_date,
      home_team_id,
      away_team_id,
      tournament_id,
      score_home,
      score_away,
      status,
      duration_minutes
    )
    VALUES($1,$2,$3,$4,$5,$6,$7,90)
    `,
    [
      date,
      homeTeamId,
      awayTeamId,
      tournamentId,
      homeScore,
      awayScore,
      status,
    ]
  );
}

async function seedBasketball() {
  const sportId = await ensureSport("Basketball");

  const tournamentId = await createTournament(
    "NBA Demo League",
    "USA",
    sportId
  );

  const lakers = await createTeam("Lakers", tournamentId);
  const warriors = await createTeam("Warriors", tournamentId);
  const bulls = await createTeam("Chicago Bulls", tournamentId);
  const celtics = await createTeam("Boston Celtics", tournamentId);

  await createMatch({
    homeTeamId: lakers,
    awayTeamId: warriors,
    tournamentId,
    date: "2026-05-21 20:00:00",
    homeScore: 99,
    awayScore: 94,
    status: "finished",
  });

  await createMatch({
    homeTeamId: bulls,
    awayTeamId: celtics,
    tournamentId,
    date: "2026-05-22 18:00:00",
    homeScore: 77,
    awayScore: 80,
    status: "live",
  });
}

async function seedHockey() {
  const sportId = await ensureSport("Hockey");

  const tournamentId = await createTournament(
    "NHL Demo League",
    "Canada",
    sportId
  );

  const oilers = await createTeam("Edmonton Oilers", tournamentId);
  const leafs = await createTeam("Toronto Maple Leafs", tournamentId);

  await createMatch({
    homeTeamId: oilers,
    awayTeamId: leafs,
    tournamentId,
    date: "2026-05-23 19:30:00",
    homeScore: 4,
    awayScore: 3,
    status: "finished",
  });
}

async function seedTennis() {
  const sportId = await ensureSport("Tennis");

  const tournamentId = await createTournament(
    "ATP Demo Tour",
    "World",
    sportId
  );

  const alcaraz = await createTeam("Carlos Alcaraz", tournamentId);
  const sinner = await createTeam("Jannik Sinner", tournamentId);

  await createMatch({
    homeTeamId: alcaraz,
    awayTeamId: sinner,
    tournamentId,
    date: "2026-05-24 14:00:00",
    homeScore: 2,
    awayScore: 1,
    status: "live",
  });
}

async function seedVolleyball() {
  const sportId = await ensureSport("Volleyball");

  const tournamentId = await createTournament(
    "Volleyball Super League",
    "Poland",
    sportId
  );

  const team1 = await createTeam("Barkom-Kazhany", tournamentId);
  const team2 = await createTeam("Epicentr-Podiliany", tournamentId);

  await createMatch({
    homeTeamId: team1,
    awayTeamId: team2,
    tournamentId,
    date: "2026-05-25 17:00:00",
    homeScore: 2,
    awayScore: 0,
    status: "live",
  });
}

async function seedEsports() {
  const sportId = await ensureSport("Esports");

  const tournamentId = await createTournament(
    "CS2 Major",
    "Europe",
    sportId
  );

  const navi = await createTeam("NAVI", tournamentId);
  const faze = await createTeam("FaZe Clan", tournamentId);

  await createMatch({
    homeTeamId: navi,
    awayTeamId: faze,
    tournamentId,
    date: "2026-05-26 21:00:00",
    homeScore: 1,
    awayScore: 1,
    status: "live",
  });
}

(async () => {
  try {
    console.log("🌱 Seeding demo sports...");

    await seedBasketball();
    await seedHockey();
    await seedTennis();
    await seedVolleyball();
    await seedEsports();

    console.log("✅ Demo sports added!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();