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

export default function MatchesPage({ selectedSportId, selectedLeagueId }) {
  const { lang, user } = useAuth();

  const [matches, setMatches] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);

  const [error, setError] = useState("");
  const [eventsError, setEventsError] = useState("");

  const [status, setStatus] = useState("all");
  const [onlyFavorites, setOnlyFavorites] = useState(false);

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
          try {
            const fav = await getFavorites();
            const ids = Array.isArray(fav)
              ? fav.map((x) => (typeof x === "object" ? x.team_id : x))
              : [];
            setFavorites(new Set(ids.map((x) => Number(x))));
          } catch {
            setFavorites(new Set());
          }
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
    if (!onlyFavorites) return matches;

    return matches.filter(
      (m) =>
        favorites.has(Number(m.home_team_id)) ||
        favorites.has(Number(m.away_team_id))
    );
  }, [matches, favorites, onlyFavorites]);

  const selectedLeagueName =
    selectedLeagueId && matches.length > 0
      ? matches.find((m) => Number(m.tournament_id) === Number(selectedLeagueId))
          ?.tournament
      : null;

  async function toggleFav(teamId) {
    try {
      setFavError("");

      if (!user) {
        setFavError("Щоб додати команду в обране, увійдіть або зареєструйтесь.");
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
          <div className="h1">{t(lang, "matches")}</div>
          <div className="muted">{t(lang, "matchesHint")}</div>
        </div>

        <Link className="btn" to="/">
          ← {t(lang, "dashboard")}
        </Link>
      </div>

      {error && <div className="error">{error}</div>}
      {favError && <div className="error">{favError}</div>}

      {!error && matches.length === 0 && (
        <p className="muted">{t(lang, "loading")}</p>
      )}

      {matches.length > 0 && (
        <>
          <div className="filtersRow">
            <div className="field" style={{ width: 240 }}>
              <div className="label">{t(lang, "status")}</div>
              <select
                className="select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">{t(lang, "all")}</option>
                <option value="scheduled">{t(lang, "scheduled")}</option>
                <option value="live">{t(lang, "live")}</option>
                <option value="finished">{t(lang, "finished")}</option>
              </select>
            </div>

            <button className="btn" onClick={() => setStatus("all")}>
              {t(lang, "reset")}
            </button>

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
              onClick={() => setOnlyFavorites((prev) => !prev)}
              disabled={!user}
              title={!user ? "Увійдіть, щоб бачити улюблені команди" : ""}
            >
              ⭐ {onlyFavorites ? "Усі матчі" : "Тільки обране"}
            </button>
          </div>

          <div className={`matchesSplit ${selectedMatch ? "withPanel" : ""}`}>
            <div className="matchesListCol">
              <div className="list">
                {filteredMatches.map((m) => {
                  const active =
                    Number(selectedMatch?.match_id) === Number(m.match_id);

                  return (
                    <div
                      key={m.match_id}
                      className={`cardRow matchClickable ${
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
                          >
                            {favorites.has(Number(m.home_team_id)) ? "★" : "☆"}
                          </button>

                          <span className="cardTitle">
                            {m.home_team}{" "}
                            <span style={{ opacity: 0.7 }}>{t(lang, "vs")}</span>{" "}
                            {m.away_team}
                          </span>

                          <button
                            className="starBtn"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleFav(m.away_team_id);
                            }}
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
                        {m.score_home ?? "-"} : {m.score_away ?? "-"}
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
                </div>

                <div className="detailsTeams">
                  <div className="detailsTeam">{selectedMatch.home_team}</div>

                  <div className="detailsScore">
                    {selectedMatch.score_home ?? "-"} :{" "}
                    {selectedMatch.score_away ?? "-"}
                  </div>

                  <div className="detailsTeam">{selectedMatch.away_team}</div>
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