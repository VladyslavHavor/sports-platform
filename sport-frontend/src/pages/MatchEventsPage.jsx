import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getMatch, getMatchEvents, updateMatch, addEvent } from "../api";
import { teamName } from "../teamTranslations";
import { useAuth } from "../auth/AuthContext";

function fmtScore(a, b) {
  const left = a == null ? "-" : a;
  const right = b == null ? "-" : b;
  return `${left} : ${right}`;
}

function fmtSeason(season) {
  if (!season) return "";
  return `${season}/${Number(season) + 1}`;
}

function statusLabel(status) {
  if (status === "scheduled") return "Заплановано";
  if (status === "live") return "Наживо";
  if (status === "finished") return "Завершено";
  return status;
}

function eventLabel(type) {
  if (type === "goal") return "⚽ Гол";
  if (type === "yellow_card") return "🟨 Жовта картка";
  if (type === "red_card") return "🟥 Червона картка";
  if (type === "assist") return "🎯 Асист";
  return type;
}

export default function MatchEventsPage({ adminMode }) {
  const { id } = useParams();

  const [match, setMatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("events");
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
const [editScoreHome, setEditScoreHome] = useState("");
const [editScoreAway, setEditScoreAway] = useState("");
//const [editDate, setEditDate] = useState("");
const [editMessage, setEditMessage] = useState("");
const [eventMinute, setEventMinute] = useState("");
const [eventTeam, setEventTeam] = useState("home");
const [eventType, setEventType] = useState("goal");

const { lang, user } = useAuth();
  useEffect(() => {
    async function load() {
      try {
        setError("");

        const matchData = await getMatch(id);
        const eventsData = await getMatchEvents(id);

        setMatch(matchData);
        setEvents(eventsData || []);
      } catch (e) {
        setError(e?.response?.data?.error || e.message);
      }
    }

    load();
  }, [id]);

function openEditForm() {
  setEditOpen(true);
  setEditMessage("");
  setEditScoreHome(match.score_home ?? 0);
  setEditScoreAway(match.score_away ?? 0);
}
async function handleUpdateMatch(e) {
  e.preventDefault();

  try {
    setEditMessage("");

    await updateMatch(match.match_id, {
      score_home: editScoreHome,
      score_away: editScoreAway,
    });

    const freshMatch = await getMatch(match.match_id);

    setMatch(freshMatch);

    setEditMessage("Рахунок успішно оновлено.");
    setEditOpen(false);
  } catch (e) {
    setEditMessage(e?.response?.data?.error || e.message);
  }
}
async function handleAddDemoEvent(e) {
  e.preventDefault();

  if (!eventMinute) return;

  try {
    const savedEvent = await addEvent(match.match_id, {
      minute: Number(eventMinute),
      type: eventType,
      team: eventTeam,
    });

    setEvents((prev) =>
      [...prev, savedEvent].sort(
        (a, b) => Number(a.minute) - Number(b.minute)
      )
    );

    if (eventType === "goal") {
      setMatch((prev) => ({
        ...prev,
        score_home:
          eventTeam === "home"
            ? Number(prev.score_home || 0) + 1
            : prev.score_home,
        score_away:
          eventTeam === "away"
            ? Number(prev.score_away || 0) + 1
            : prev.score_away,
      }));
    }

    setEventMinute("");
  } catch (err) {
    alert(err?.response?.data?.error || err.message);
  }
  setEventMinute("");
}

  const demoStats = useMemo(() => {
  if (!match) return [];

  if (match.status === "scheduled") {
    return [
      ["Статистика", "-", "-"],
    ];
  }

  const matchId = Number(match.match_id || id || 0);
  const tournament = String(match.tournament || "").toLowerCase();

  const isFootball =
  tournament.includes("premier league") ||
  tournament.includes("bundesliga") ||
  tournament.includes("serie a") ||
  tournament.includes("la liga") ||
  tournament.includes("ligue 1") ||
  tournament.includes("ukrainian premier league") ||
  tournament.includes("eredivisie") ||
  tournament.includes("primeira liga") ||
  tournament.includes("super lig") ||
  tournament.includes("pro league") ||
  tournament.includes("mls");

if (isFootball) {
  const possessionHome = 45 + (matchId % 15);
  const possessionAway = 100 - possessionHome;

  return [
    ["Удари", 8 + (matchId % 10), 5 + (matchId % 8)],
    ["Володіння", `${possessionHome}%`, `${possessionAway}%`],
    ["Кутові", 3 + (matchId % 5), 2 + (matchId % 4)],
    ["Удари в площину", 3 + (matchId % 5), 2 + (matchId % 4)],
    ["Фоли", 9 + (matchId % 7), 8 + (matchId % 6)],
    ["Офсайди", matchId % 4, matchId % 3],
    ["Жовті картки", 1 + (matchId % 3), matchId % 4],
    ["Сейви", 2 + (matchId % 5), 3 + (matchId % 4)],
  ];
}

  // Basketball
 if (tournament.includes("nba") || tournament.includes("basket")) {
  return [
    ["Кидки з гри", 35 + (matchId % 12), 32 + (matchId % 10)],
    ["Триочкові", 8 + (matchId % 7), 6 + (matchId % 6)],
    ["Підбирання", 40 + (matchId % 11), 36 + (matchId % 10)],

    ["Штрафні кидки", 15 + (matchId % 8), 12 + (matchId % 7)],
    ["Передачі", 20 + (matchId % 9), 18 + (matchId % 8)],
    ["Перехоплення", 5 + (matchId % 4), 4 + (matchId % 4)],
    ["Блок-шоти", 2 + (matchId % 4), 1 + (matchId % 3)],
  ];
}

// Hockey
if (tournament.includes("nhl") || tournament.includes("hockey")) {
  return [
    ["Кидки по воротах", 25 + (matchId % 14), 22 + (matchId % 12)],
    ["Сейви воротаря", 20 + (matchId % 10), 22 + (matchId % 9)],
    ["Вилучення", 1 + (matchId % 4), 1 + ((matchId + 1) % 4)],

    ["Силові прийоми", 15 + (matchId % 10), 14 + (matchId % 9)],
    ["Вкидання виграно", 24 + (matchId % 8), 22 + (matchId % 8)],
  ];
}

// Tennis
if (tournament.includes("atp") || tournament.includes("tennis")) {
  return [
    ["Ейси", 4 + (matchId % 9), 3 + (matchId % 8)],
    ["Віннерси", 22 + (matchId % 13), 19 + (matchId % 12)],
    ["Подвійні помилки", matchId % 4, (matchId + 2) % 4],

    ["Невимушені помилки", 15 + (matchId % 9), 16 + (matchId % 8)],
    ["Виграні брейк-пойнти", 2 + (matchId % 4), 1 + (matchId % 4)],
  ];
}

// Volleyball
if (tournament.includes("volley") || tournament.includes("cev")) {
  return [
    ["Атаки", 42 + (matchId % 13), 39 + (matchId % 12)],
    ["Блоки", 6 + (matchId % 6), 5 + (matchId % 5)],
    ["Ейси", 3 + (matchId % 6), 2 + (matchId % 5)],

    ["Помилки на подачі", 7 + (matchId % 5), 6 + (matchId % 5)],
    ["Прийом", `${55 + (matchId % 15)}%`, `${50 + (matchId % 14)}%`],
  ];
}

// Esports
if (
  tournament.includes("esl") ||
  tournament.includes("iem") ||
  tournament.includes("blast") ||
  tournament.includes("major") ||
  tournament.includes("pgl") ||
  tournament.includes("cs2")
) {
  const overtime = matchId % 5 === 0;
  const homeWon = matchId % 2 === 0;

  const homeRounds = homeWon
    ? overtime
      ? 16
      : 13
    : overtime
      ? 14
      : 8 + (matchId % 4);

  const awayRounds = homeWon
    ? overtime
      ? 14
      : 8 + (matchId % 4)
    : overtime
      ? 16
      : 13;

  return [
    ["Раунди виграно", homeRounds, awayRounds],
    ["Вбивства", 140 + homeRounds * 3 + (matchId % 20), 135 + awayRounds * 3 + (matchId % 18)],
    ["Смерті", 135 + awayRounds * 3 + (matchId % 18), 140 + homeRounds * 3 + (matchId % 20)],

    ["Асисти", 35 + (matchId % 12), 32 + (matchId % 10)],
    ["Перші вбивства", 8 + (matchId % 5), 6 + (matchId % 5)],
  ];
}

// Football default
const possessionHome = 45 + (matchId % 15);
const possessionAway = 100 - possessionHome;

return [
  ["Удари", 8 + (matchId % 10), 5 + (matchId % 8)],
  ["Володіння", `${possessionHome}%`, `${possessionAway}%`],
  ["Кутові", 3 + (matchId % 5), 2 + (matchId % 4)],

  ["Удари в площину", 3 + (matchId % 5), 2 + (matchId % 4)],
  ["Фоли", 9 + (matchId % 7), 8 + (matchId % 6)],
  ["Офсайди", matchId % 4, matchId % 3],
  ["Жовті картки", 1 + (matchId % 3), matchId % 4],
  ["Сейви", 2 + (matchId % 5), 3 + (matchId % 4)],
];
}, [match, id]);

  if (error) {
    return (
      <div className="container matchDetailsPage">
        <div className="error">{error}</div>

        <div style={{ marginTop: 12 }}>
          <Link className="standingsBackBtn" to="/">
            ← Повернутися назад
          </Link>

        </div>
      </div>
    );
  }

  const tournament = String(match?.tournament || "").toLowerCase();

const tournamentNameLower = String(match?.tournament || "").toLowerCase();

const isFootball =
  !tournamentNameLower.includes("nba") &&
  !tournamentNameLower.includes("basket") &&
  !tournamentNameLower.includes("nhl") &&
  !tournamentNameLower.includes("hockey") &&
  !tournamentNameLower.includes("atp") &&
  !tournamentNameLower.includes("tennis") &&
  !tournamentNameLower.includes("volley") &&
  !tournamentNameLower.includes("cev") &&
  !tournamentNameLower.includes("esl") &&
  !tournamentNameLower.includes("iem") &&
  !tournamentNameLower.includes("blast") &&
  !tournamentNameLower.includes("major") &&
  !tournamentNameLower.includes("pgl") &&
  !tournamentNameLower.includes("cs2");
if (!isFootball && activeTab === "events") {
  setActiveTab("stats");
}
  if (!match) {
    return <div className="container matchDetailsPage muted">Loading...</div>;
  }

  return (
    <div className="container matchDetailsPage">
    <div className="matchDetailsTop">
  <Link to="/" className="standingsBackBtn">
    <span className="backArrow">←</span>
    <span>Повернутися назад</span>
  </Link>
 {user?.role === "admin" && (
    <button className="btnPrimary" onClick={openEditForm}>
      ✏️ Редагувати рахунок
    </button>
      )}
</div>

      <div className="matchHeroCard">
        <div className="matchHeroMeta">
          <span>{match.tournament || "Tournament"}</span>

          {match.season ? (
            <>
              <span>•</span>
              <span>{fmtSeason(match.season)}</span>
            </>
          ) : null}

          <span>•</span>
          <span>{new Date(match.match_date).toLocaleString()}</span>
        </div>

{user?.role === "admin" && editOpen && (
  <form className="adminEditCard scoreEditorCard" onSubmit={handleUpdateMatch}>
    <div className="scoreEditorHead">
      <div>
        <h3>Редагування рахунку</h3>
        <p>Адміністратор може вручну оновити результат матчу.</p>
      </div>

      <button
        type="button"
        className="scoreEditorClose"
        onClick={() => setEditOpen(false)}
      >
        ×
      </button>
    </div>

    <div className="scoreEditorTeams">
      <div className="scoreEditTeam">
        <span>{teamName(match.home_team, lang)}</span>

        <div className="scoreStepper">
          <button type="button" onClick={() => setEditScoreHome(Math.max(0, Number(editScoreHome || 0) - 1))}>−</button>

          <input
            type="number"
            min="0"
            value={editScoreHome}
            onChange={(e) => setEditScoreHome(e.target.value)}
          />

          <button type="button" onClick={() => setEditScoreHome(Number(editScoreHome || 0) + 1)}>+</button>
        </div>
      </div>

      <div className="scoreEditDivider">VS</div>

      <div className="scoreEditTeam right">
        <span>{teamName(match.away_team, lang)}</span>

        <div className="scoreStepper">
          <button type="button" onClick={() => setEditScoreAway(Math.max(0, Number(editScoreAway || 0) - 1))}>−</button>

          <input
            type="number"
            min="0"
            value={editScoreAway}
            onChange={(e) => setEditScoreAway(e.target.value)}
          />

          <button type="button" onClick={() => setEditScoreAway(Number(editScoreAway || 0) + 1)}>+</button>
        </div>
      </div>
    </div>

    {editMessage && <div className="muted">{editMessage}</div>}

    <div className="adminEditActions">
      <button type="submit" className="btnPrimary">
        Зберегти рахунок
      </button>

      <button type="button" className="btn" onClick={() => setEditOpen(false)}>
        Скасувати
      </button>
    </div>
  </form>
)}



        <div className="matchHeroScore">
          <Link
  to={`/teams/${match.home_team_id}`}
  className="matchTeamName teamClickable"
>
  {teamName(match.home_team, lang)}
</Link>

          <div className="matchScoreBox">
            {fmtScore(match.score_home, match.score_away)}
          </div>

          <Link
  to={`/teams/${match.away_team_id}`}
  className="matchTeamName right teamClickable"
>
  {teamName(match.away_team, lang)}
</Link>
        </div>

        <div className="matchHeroStatus">
          <div className={`badge ${match.status}`}>
            <span className="badgeDot" />
            {statusLabel(match.status)}
          </div>
        </div>
      </div>

      <div className="matchDetailsGrid">
        <div className="matchMainCard">
          <div className="matchTabs">
          {isFootball && match.status !== "scheduled" && (
  <button
    className={`matchTab ${activeTab === "events" ? "active" : ""}`}
    onClick={() => setActiveTab("events")}
  >
    Події
  </button>
)}
            <button
              className={`matchTab ${activeTab === "stats" ? "active" : ""}`}
              onClick={() => setActiveTab("stats")}
            >
              Статистика
            </button>
          </div>

          {activeTab === "events" && match.status !== "scheduled" && (
            <div className="matchSection">
              <h2>Події матчу</h2>

             {user?.role === "admin" &&
  isFootball &&
  match.status !== "scheduled" && (
  <form className="adminEventForm" onSubmit={handleAddDemoEvent}>
    <h3>Додати подію</h3>

    <div className="adminEventGrid">
      <input
        type="number"
        min="1"
        max="120"
        placeholder="Хвилина"
        value={eventMinute}
        onChange={(e) => setEventMinute(e.target.value)}
      />

      <select
        value={eventTeam}
        onChange={(e) => setEventTeam(e.target.value)}
      >
        <option value="home">
          {teamName(match.home_team, lang)}
        </option>

        <option value="away">
          {teamName(match.away_team, lang)}
        </option>
      </select>

      <select
        value={eventType}
        onChange={(e) => setEventType(e.target.value)}
      >
        <option value="goal">Гол</option>
        <option value="yellow_card">Жовта картка</option>
        <option value="red_card">Червона картка</option>
      </select>

      <button type="submit" className="btnPrimary">
        Додати
      </button>
    </div>
  </form>
)}

              {events.length > 0 ? (
                <div className="eventsTimeline">
                  {events.map((e) => (
                    <div key={e.event_id} className="timelineItem">
                      <div className="timelineMinute">{e.minute}'</div>

                     <div className="timelineBody">
  <div className="eventWho">
    {teamName(e.team_name, lang)}
  </div>
</div>

                     <div className={`eventType event-${e.type}`}>
  {eventLabel(e.type)}
</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="emptyStandings">
                  <p className="muted">
                    Подій поки немає.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "stats" && (
            <div className="matchSection">
              <h2>Статистика матчу</h2>

              <div className="statsListBig">
                {demoStats.map(([label, home, away]) => (
                  <div className="statLineBig" key={label}>
                    <div className="statValue">{home}</div>
                    <div className="statName">{label}</div>
                    <div className="statValue right">{away}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="matchSideCard">
          <h3>Інформація</h3>

          <div className="infoRow">
            <span>Турнір</span>
            <strong>{match.tournament || "—"}</strong>
          </div>

          <div className="infoRow">
            <span>Сезон</span>
            <strong>{fmtSeason(match.season) || "—"}</strong>
          </div>

          <div className="infoRow">
            <span>Статус</span>
            <strong>{statusLabel(match.status)}</strong>
          </div>

          <div className="infoRow">
            <span>Дата</span>
            <strong>{new Date(match.match_date).toLocaleDateString()}</strong>
          </div>

          <div className="infoRow">
            <span>Час</span>
            <strong>{new Date(match.match_date).toLocaleTimeString()}</strong>
          </div>

          <Link className="btnPrimary fullWidthBtn" to={`/tournaments/${match.tournament_id}/standings`}>
            Відкрити таблицю 
          </Link>
        </aside>
      </div>
    </div>
  );
}