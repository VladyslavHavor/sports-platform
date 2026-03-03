import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMatches } from "../api";
import { useAuth } from "../auth/AuthContext";
import { t } from "../i18n";

export default function MatchesPage({ selectedSportId, selectedLeagueId }) {
  const { lang } = useAuth();

  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");

  const [status, setStatus] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        setError("");
        const params = {};

        if (selectedLeagueId) params.tournamentId = selectedLeagueId;
        else if (selectedSportId) params.sportId = selectedSportId;

        if (status !== "all") params.status = status;

        const data = await getMatches(params);
        setMatches(data);
      } catch (e) {
        setError(e?.response?.data?.error || e.message);
      }
    })();
  }, [selectedLeagueId, selectedSportId, status]);

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
      {!error && matches.length === 0 && <p className="muted">{t(lang, "loading")}</p>}

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
          </div>

          <div className="list">
            {matches.map((m) => (
              <div key={m.match_id} className="cardRow">
                <div className="cardRowMain">
                  <Link className="cardTitle" to={`/matches/${m.match_id}`}>
                    {m.home_team} <span style={{ opacity: 0.7 }}>{t(lang, "vs")}</span>{" "}
                    {m.away_team}
                  </Link>

                  <div className="meta">
                    <span>{new Date(m.match_date).toLocaleString()}</span>
                    <span className="dot">•</span>
                    <span>{m.tournament || t(lang, "noTournament")}</span>
                    <span className="dot">•</span>
                    <span className={`badge ${m.status}`}>
                      <span className="badgeDot" />
                      {t(lang, m.status)}
                    </span>

                    {m.tournament_id ? (
                      <>
                        <span className="dot">•</span>
                        <Link to={`/tournaments/${m.tournament_id}/standings`}>
                          {t(lang, "viewStandings")} →
                        </Link>
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="scoreBubble">
                  {m.score_home} : {m.score_away}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}