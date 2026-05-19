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
  const [favorites, setFavorites] = useState(new Set());
  const [favError, setFavError] = useState("");

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
  }, [selectedLeagueId, selectedSportId, status, user]);

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
  ⭐ {onlyFavorites ? "Усі матчі" : "Тільки обране"}
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
                      onClick={() => setSelectedMatch(m)}
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
                           {teamName(m.home_team, lang)}{" "}
                            <span style={{ opacity: 0.7 }}>{t(lang, "vs")}</span>{" "}
                            {teamName(m.away_team, lang)}
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
                            {t(lang, m.status)}
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
                    {t(lang, selectedMatch.status)}
                  </span>
                </div>

                <div className="detailsTabs">
                  <div className="detailsTab active">Події</div>
                  <div className="detailsTab">Статистика</div>
                </div>

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
                            <strong>{e.minute}'</strong> — {e.full_name}
                            <div className="muted" style={{ fontSize: 12 }}>
                              {e.team_name}
                            </div>
                          </div>

                          <span className="eventTypeBadge">{e.type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="detailsSection">
                  <h3>Швидка статистика</h3>

                  <div className="fakeStats">
                    <div className="fakeStatRow">
                      <span>Удари</span>
                      <strong>—</strong>
                    </div>
                    <div className="fakeStatRow">
                      <span>Володіння</span>
                      <strong>—</strong>
                    </div>
                    <div className="fakeStatRow">
                      <span>Кутові</span>
                      <strong>—</strong>
                    </div>
                  </div>
                </div>

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