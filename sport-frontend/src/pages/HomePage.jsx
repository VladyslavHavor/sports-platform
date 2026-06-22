import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getMatches,
  getMatchEvents,
  getFavorites,
  addFavorite,
  removeFavorite,
} from "../api";
import { useAuth } from "../auth/AuthContext";
import { t } from "../i18n";
import { teamName } from "../teamTranslations";

function eventLabel(type) {
  if (type === "goal") return "⚽ Гол";
  if (type === "yellow_card") return "🟨 Жовта";
  if (type === "red_card") return "🟥 Червона";
  if (type === "assist") return "🎯 Асист";
  return type;
}

function liveMinute(match) {
  if (match.status !== "live") return null;

  const start = new Date(match.match_date);
  const now = new Date();

  return Math.max(
    1,
    Math.floor((now.getTime() - start.getTime()) / 60000)
  );
}

export default function HomePage({ selectedSportId, selectedLeagueId }) {
  const { lang, user } = useAuth();

  const [matches, setMatches] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);

  const [error, setError] = useState("");
  const [eventsError, setEventsError] = useState("");

  const [status, setStatus] = useState("all");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
const [search, setSearch] = useState("");
const [season, setSeason] = useState(2025);
  const [favorites, setFavorites] = useState(new Set());
  const [favError, setFavError] = useState("");
  const [detailsTab, setDetailsTab] = useState("events");

  useEffect(() => {
    (async () => {
      try {
        setError("");
        setSelectedMatch(null);
        setEvents([]);

        const params = {};
        if (selectedLeagueId) params.tournamentId = selectedLeagueId;
        else if (selectedSportId) params.sportId = selectedSportId;
        if (status !== "all") params.status = status;
params.season = season;
        const data = await getMatches(params);
        setMatches(data);

        if (user) {
          const fav = await getFavorites();
          const ids = Array.isArray(fav)
            ? fav.map((x) => (typeof x === "object" ? x.team_id : x))
            : [];
          setFavorites(new Set(ids.map((x) => Number(x))));
        } else {
          setFavorites(new Set());
          setOnlyFavorites(false);
        }
      } catch (e) {
        setError(e?.response?.data?.error || e.message);
      }
    })();
  }, [selectedLeagueId, selectedSportId, status, user, season]);

  useEffect(() => {
    if (!selectedMatch?.match_id) {
      setEvents([]);
      return;
    }

    
    
    (async () => {
      try {
        setEventsError("");
        const data = await getMatchEvents(selectedMatch.match_id);
        setEvents(data);
      } catch (e) {
        setEvents([]);
        setEventsError(e?.response?.data?.error || e.message);
      }
    })();
  }, [selectedMatch]);

useEffect(() => {
  document.title = selectedLeagueId
    ? "FastScore — Матчі ліги"
    : "FastScore — Всі матчі";
}, [selectedLeagueId]);

 function isFootballQuick(match) {
  const tournament = String(match?.tournament || "").toLowerCase();

  return (
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
    tournament.includes("super league") ||
    tournament.includes("mls")
  );
}

function quickStatsForMatch(match) {
  const matchId = Number(match?.match_id || 0);
  const tournament = String(match?.tournament || "").toLowerCase();
if (match?.status === "scheduled") {
  return [];
}

  const isFootball =
  tournament.includes("premier league") ||
  tournament.includes("bundesliga") ||
  tournament.includes("serie a") ||
  tournament.includes("la liga") ||
  tournament.includes("ligue 1") ||
  tournament.includes("ukrainian premier league");


  const isBasketball =
    tournament.includes("nba") || tournament.includes("basket");

  const isHockey =
    tournament.includes("nhl") || tournament.includes("hockey");

  const isTennis =
    tournament.includes("atp") ||
    tournament.includes("tennis") ||
    tournament.includes("open");

  const isVolleyball =
    tournament.includes("volley") ||
    tournament.includes("cev") ||
    tournament.includes("superlega");

  const isEsports =
  tournament.includes("cs2") ||
  tournament.includes("esports") ||
  tournament.includes("esl") ||
  tournament.includes("iem") ||
  tournament.includes("blast") ||
  tournament.includes("pgl") ||
  tournament.includes("major");

 
  if (isFootball) {
  const possessionHome = 45 + (matchId % 15);
  const possessionAway = 100 - possessionHome;

  return [
    ["Володіння", `${possessionHome}% — ${possessionAway}%`],
    ["Удари", `${8 + (matchId % 10)} — ${5 + (matchId % 8)}`],
    ["Кутові", `${3 + (matchId % 5)} — ${2 + (matchId % 4)}`],
  ];
}

  if (isBasketball) {
    return [
      ["Кидки з гри", `${35 + (matchId % 12)} — ${32 + (matchId % 10)}`],
      ["Триочкові", `${8 + (matchId % 7)} — ${6 + (matchId % 6)}`],
      ["Підбирання", `${40 + (matchId % 11)} — ${36 + (matchId % 10)}`],
    ];
  }

  if (isHockey) {
    return [
      ["Кидки по воротах", `${25 + (matchId % 14)} — ${22 + (matchId % 12)}`],
      ["Сейви воротаря", `${20 + (matchId % 10)} — ${22 + (matchId % 9)}`],
      ["Вилучення", `${1 + (matchId % 4)} — ${1 + ((matchId + 1) % 4)}`],
    ];
  }

  if (isTennis) {
    return [
      ["Ейси", `${4 + (matchId % 9)} — ${3 + (matchId % 8)}`],
      ["Віннерси", `${22 + (matchId % 13)} — ${19 + (matchId % 12)}`],
      ["Подвійні помилки", `${matchId % 4} — ${(matchId + 2) % 4}`],
    ];
  }

  if (isVolleyball) {
    return [
      ["Атаки", `${42 + (matchId % 13)} — ${39 + (matchId % 12)}`],
      ["Блоки", `${6 + (matchId % 6)} — ${5 + (matchId % 5)}`],
      ["Ейси", `${3 + (matchId % 6)} — ${2 + (matchId % 5)}`],
    ];
  }

  if (isEsports) {
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
      ["Вбивства", `${60 + homeRounds + (matchId % 10)} — ${58 + awayRounds + (matchId % 9)}`],
      ["Смерті", `${58 + awayRounds + (matchId % 9)} — ${60 + homeRounds + (matchId % 10)}`],
      ["Раунди виграно", `${homeRounds} — ${awayRounds}`],
    ];
  }

  const possessionHome = 45 + (matchId % 15);
  const possessionAway = 100 - possessionHome;

  return [
    ["Удари", `${8 + (matchId % 10)} — ${5 + (matchId % 8)}`],
    ["Володіння", `${possessionHome}% — ${possessionAway}%`],
    ["Кутові", `${3 + (matchId % 5)} — ${2 + (matchId % 4)}`],
  ];
}

  const filteredMatches = useMemo(() => {
  let result = matches;

  if (onlyFavorites) {
    result = result.filter(
      (m) =>
        favorites.has(Number(m.home_team_id)) ||
        favorites.has(Number(m.away_team_id))
    );
  }

  const q = search.trim().toLowerCase();

  if (q) {
    result = result.filter((m) => {
const home = String(m.home_team || "").toLowerCase();
const away = String(m.away_team || "").toLowerCase();
const tournament = String(m.tournament || "").toLowerCase();

const homeUa = teamName(m.home_team, "ua").toLowerCase();
const awayUa = teamName(m.away_team, "ua").toLowerCase();



return (
  home.includes(q) ||
  away.includes(q) ||
  tournament.includes(q) ||
  homeUa.includes(q) ||
  awayUa.includes(q)
);
    });
  }

  return result;
}, [matches, favorites, onlyFavorites, search]);

  const selectedLeagueName =
    selectedLeagueId && matches.length > 0
      ? matches.find((m) => Number(m.tournament_id) === Number(selectedLeagueId))
          ?.tournament
      : null;

  const counts = useMemo(() => {
    const total = filteredMatches.length;
    const liveNow = filteredMatches.filter((m) => m.status === "live").length;
    const finished = filteredMatches.filter((m) => m.status === "finished").length;
    const todayStr = new Date().toDateString();

    const today = filteredMatches.filter(
      (m) => new Date(m.match_date).toDateString() === todayStr
    ).length;

    return { total, liveNow, today, finished };
  }, [filteredMatches]);

  async function toggleFav(teamId) {
    try {
      setFavError("");

      if (!user) {
        setFavError("Щоб додати команду в обране, увійдіть або зареєструйтесь.");
         setTimeout(() => {
      setFavError("");
    }, 3000);
        return;
      }

      const id = Number(teamId);
      const next = new Set(favorites);

      if (next.has(id)) {
        await removeFavorite(id);
        next.delete(id);
      } else {
        await addFavorite(id);
        next.add(id);
      }

      setFavorites(next);
    } catch (e) {
      setFavError(e?.response?.data?.error || e.message || "Favorites error");
    }
  }

  function closePanel() {
    setSelectedMatch(null);
    setEvents([]);
    setEventsError("");
  }
//const matchId = Number(selectedMatch?.match_id || 0);

//const possessionHome = 45 + (matchId % 15);
//const possessionAway = 100 - possessionHome;

//const shotsHome = 8 + (matchId % 10);
//const shotsAway = 5 + (matchId % 8);

//const cornersHome = 3 + (matchId % 5);
//const cornersAway = 2 + (matchId % 4);

  return (
    <div className="container">
      <div className="pageHead">
        <div>
        </div>


      </div>

      {error && <div className="error">{error}</div>}
      {favError && <div className="error">{favError}</div>}

   {!error && matches.length === 0 && (
  <div style={{ marginTop: 24 }}>
    <p className="muted" style={{ marginBottom: 16 }}>
      Матчів за цим фільтром наразі немає.
    </p>

    <button
      className="btnPrimary"
      onClick={() => {
  setStatus("all");
  setOnlyFavorites(false);
  setSearch("");
  setSeason(2025);
  window.location.href = "/";
}}
    >
      ← Повернутися до головної сторінки
    </button>
  </div>
)}
      {matches.length > 0 && (
        <>
          <div className="chipsRow">
            <div className="chip">{t(lang, "total")}: {counts.total}</div>
            <div className="chip">{t(lang, "liveNow")}: {counts.liveNow}</div>
            <div className="chip">{t(lang, "today")}: {counts.today}</div>
            <div className="chip">{t(lang, "finished")}: {counts.finished}</div>
          </div>
<div className="searchRow">
  <input
    className="searchInput"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
placeholder={t(lang, "searchPlaceholder")}  />

  {search && (
    <button className="btn" onClick={() => setSearch("")}>
      Очистити
    </button>
  )}
</div>
<div className="seasonFilter">
  <span>Сезон</span>

  <select
    className="select"
    value={season}
    onChange={(e) => setSeason(Number(e.target.value))}
  >
    <option value={2025}>2025/2026</option>
    <option value={2024}>2024/2025</option>
    <option value={2023}>2023/2024</option>
  </select>
</div>
          <div className="filtersRow">
           <div className="statusTabs">
  <button
    className={`statusTab ${status === "all" ? "active" : ""}`}
    onClick={() => setStatus("all")}
  >
    {t(lang, "all")}
  </button>

  <button
    className={`statusTab ${status === "live" ? "active" : ""}`}
    onClick={() => setStatus("live")}
  >
    {t(lang, "live")}
  </button>

  <button
    className={`statusTab ${status === "finished" ? "active" : ""}`}
    onClick={() => setStatus("finished")}
  >
    {t(lang, "finished")}
  </button>

  <button
    className={`statusTab ${status === "scheduled" ? "active" : ""}`}
    onClick={() => setStatus("scheduled")}
  >
    {t(lang, "scheduled")}
  </button>
</div>



            {selectedLeagueId && selectedLeagueName && (
              <Link
                to={`/tournaments/${selectedLeagueId}/standings`}
                className="leagueTableBtn"
              >
                📊 Таблиця {selectedLeagueName}
              </Link>
            )}

            <button
  className={`btn ${onlyFavorites ? "btnPrimary" : ""}`}
 onClick={() => {
  if (!user) {
    setFavError("Щоб ввімкнути цей режим, увійдіть або зареєструйтесь.");

    setTimeout(() => {
      setFavError("");
    }, 3000);

    return;
  }

  setFavError("");
  setOnlyFavorites((prev) => !prev);
}}
>
 ⭐ {onlyFavorites ? "Всі матчі" : "Тільки обране"}
</button>
          </div>

          <div className={`matchesSplit ${selectedMatch ? "withPanel" : "noPanel"}`}>
            <div className="matchesListCol">
              {onlyFavorites && filteredMatches.length === 0 && (
                <p className="muted">Немає матчів за участю улюблених команд.</p>
              )}
{!onlyFavorites && search && filteredMatches.length === 0 && (
  <p className="muted">
    Нічого не знайдено за запитом “{search}”.
  </p>
)}
              <div className="list">
                {filteredMatches.map((m) => {
                  const active =
                    Number(selectedMatch?.match_id) === Number(m.match_id);

                  return (
                    <div
                      key={m.match_id}
                      className={`matchRow matchClickable ${
                        active ? "activeMatch" : ""
                      }`}
                      onClick={() => {
  setSelectedMatch(m);
  setDetailsTab(isFootballQuick(m) ? "events" : "stats");
}}
                    >
                      <div className="cardRowMain">
                        <div
                          style={{
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            className="starBtn"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleFav(m.home_team_id);
                            }}
                            title={t(lang, "favoriteTeam")}
                          >
                            {favorites.has(Number(m.home_team_id)) ? "★" : "☆"}
                          </button>

                          <span className="cardTitle">
  <Link
    to={`/teams/${m.home_team_id}`}
    onClick={(e) => e.stopPropagation()}
    style={{ color: "inherit", textDecoration: "none" }}
  >
    {teamName(m.home_team, lang)}
  </Link>

  {" "}
  <span style={{ opacity: 0.7 }}>vs</span>
  {" "}

  <Link
    to={`/teams/${m.away_team_id}`}
    onClick={(e) => e.stopPropagation()}
    style={{ color: "inherit", textDecoration: "none" }}
  >
    {teamName(m.away_team, lang)}
  </Link>
</span>

                          <button
                            className="starBtn"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleFav(m.away_team_id);
                            }}
                            title={t(lang, "favoriteTeam")}
                          >
                            {favorites.has(Number(m.away_team_id)) ? "★" : "☆"}
                          </button>
                        </div>

                        <div className="meta">
                          <span>{new Date(m.match_date).toLocaleString()}</span>
                          <span className="dot">•</span>
                          <span>{m.tournament || t(lang, "noTournament")}</span>
                          <span className="dot">•</span>
                         <span className={`badge ${m.status}`}>
  <span className="badgeDot" />
  {m.status === "live"
    ? `${liveMinute(m)}'`
    : t(lang, m.status)}
</span>
                        </div>
                      </div>

                      <div className="scoreBubble">
                        {m.score_home == null ? "-" : m.score_home} : {m.score_away == null ? "-" : m.score_away}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedMatch && (
              <aside className="matchDetailsPanel">
                <button className="closeDetailsBtn" onClick={closePanel}>
                  ×
                </button>

                        <div className="detailsLeague">
  {selectedMatch.tournament || "Tournament"}
  {selectedMatch.season ? (
    <span style={{ opacity: 0.7, marginLeft: 8 }}>
      • {selectedMatch.season}/{Number(selectedMatch.season) + 1}
    </span>
  ) : null}
</div>

                <div className="detailsTeams">
                  <div className="detailsTeam">{teamName(selectedMatch.home_team, lang)}</div>

                 <div className="detailsScore">
  {selectedMatch.score_home == null ? "-" : selectedMatch.score_home}
  {" : "}
  {selectedMatch.score_away == null ? "-" : selectedMatch.score_away}
</div>

                  <div className="detailsTeam">{teamName(selectedMatch.away_team, lang)}</div>
                </div>

                <div className="detailsMeta">
                  <span>{new Date(selectedMatch.match_date).toLocaleString()}</span>
                 <span className={`badge ${selectedMatch.status}`}>
  <span className="badgeDot" />
  {selectedMatch.status === "live"
    ? `${liveMinute(selectedMatch)}'`
    : t(lang, selectedMatch.status)}
</span>
                </div>

                <div className="detailsTabs">
  {isFootballQuick(selectedMatch) && selectedMatch.status !== "scheduled" && (
  <button
    className={`detailsTab ${detailsTab === "events" ? "active" : ""}`}
    onClick={() => setDetailsTab("events")}
  >
    Події
  </button>
)}

  <button
    className={`detailsTab ${detailsTab === "stats" ? "active" : ""}`}
    onClick={() => setDetailsTab("stats")}
  >
    Статистика
  </button>
</div>

                {detailsTab === "events" &&
  isFootballQuick(selectedMatch) &&
  selectedMatch.status !== "scheduled" && (
  <div className="detailsSection">
    <h3>Події матчу</h3>

    {eventsError && <div className="error">{eventsError}</div>}

    {!eventsError && events.length === 0 && (
      <div className="muted">Подій поки немає.</div>
    )}

    {events.length > 0 && (
      <div className="detailsEvents">
        {events.map((e) => (
          <div key={e.event_id} className="detailsEventItem">
            <div>
              <strong>{e.minute}'</strong> — {teamName(e.team_name, lang)}
<div className="muted" style={{ fontSize: 12 }}>
</div>
            </div>

           <span className={`eventTypeBadge event-${e.type}`}>
  {eventLabel(e.type)}
</span>
          </div>
        ))}
      </div>
    )}
  </div>
)}


{detailsTab === "stats" && (
  <div className="detailsSection">
    <h3>Швидка статистика</h3>

    {quickStatsForMatch(selectedMatch).length === 0 ? (
  <div className="muted">
    Статистика буде доступна після початку матчу.
  </div>
) : (
  <div className="fakeStats">
    {quickStatsForMatch(selectedMatch).map(([label, value]) => (
      <div className="fakeStatRow" key={label}>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    ))}
  </div>
)}
</div>

)}

                <Link
                  className="openFullMatchBtn"
                  to={`/matches/${selectedMatch.match_id}`}
                >
                  Відкрити повну сторінку →
                </Link>
              </aside>
            )}
          </div>
        </>
      )}
    </div>
  );
}