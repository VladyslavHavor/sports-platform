import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getMatch, getMatchEvents } from "../api";
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

export default function MatchEventsPage({ adminMode }) {
  const { id } = useParams();

  const [match, setMatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("events");
  const [error, setError] = useState("");
const { lang } = useAuth();
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

  const demoStats = useMemo(() => {
    if (!match) return [];

    if (match.status === "scheduled") {
      return [
        ["Удари", "-", "-"],
        ["Удари в площину", "-", "-"],
        ["Володіння", "-", "-"],
        ["Кутові", "-", "-"],
      ];
    }

    const homeSeed = Number(match.home_team_id || 1);
    const awaySeed = Number(match.away_team_id || 1);

    return [
      ["Удари", 8 + (homeSeed % 7), 7 + (awaySeed % 6)],
      ["Удари в площину", 3 + (homeSeed % 4), 2 + (awaySeed % 4)],
      ["Володіння", `${48 + (homeSeed % 8)}%`, `${52 - (homeSeed % 8)}%`],
      ["Кутові", 2 + (homeSeed % 6), 2 + (awaySeed % 5)],
    ];
  }, [match]);

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

        <div className="matchHeroScore">
          <div className="matchTeamName">{teamName(match.home_team, lang)}</div>

          <div className="matchScoreBox">
            {fmtScore(match.score_home, match.score_away)}
          </div>

          <div className="matchTeamName right">{teamName(match.away_team, lang)}</div>
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
            <button
              className={`matchTab ${activeTab === "events" ? "active" : ""}`}
              onClick={() => setActiveTab("events")}
            >
              Події
            </button>

            <button
              className={`matchTab ${activeTab === "stats" ? "active" : ""}`}
              onClick={() => setActiveTab("stats")}
            >
              Статистика
            </button>
          </div>

          {activeTab === "events" && (
            <div className="matchSection">
              <h2>Події матчу</h2>

              {adminMode && (
                <div className="muted" style={{ marginBottom: 10 }}>
                  Admin mode enabled. Тут можна додати форму подій.
                </div>
              )}

              {events.length > 0 ? (
                <div className="eventsTimeline">
                  {events.map((e) => (
                    <div key={e.event_id} className="timelineItem">
                      <div className="timelineMinute">{e.minute}'</div>

                      <div className="timelineBody">
                        <div className="eventWho">{e.full_name || "Player"}</div>
                        <div className="eventTeam">{e.team_name}</div>
                      </div>

                      <div className="eventType">{e.type}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="emptyStandings">
                  <p className="muted">
                    Подій поки немає. Для demo-матчів система показує загальну статистику.
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