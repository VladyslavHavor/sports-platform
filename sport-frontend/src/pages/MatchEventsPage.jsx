import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getMatch, getMatchEvents } from "../api";

export default function MatchEventsPage({ adminMode }) {
  const { id } = useParams();

  const [match, setMatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setError("");
        const matchData = await getMatch(id);
        const eventsData = await getMatchEvents(id);
        setMatch(matchData);
        setEvents(eventsData);
      } catch (e) {
        setError(e?.response?.data?.error || e.message);
      }
    }
    load();
  }, [id]);

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
        <div style={{ marginTop: 12 }}>
          <Link className="btn" to="/matches">← Back to matches</Link>
        </div>
      </div>
    );
  }

  if (!match) {
    return <div className="container muted">Loading...</div>;
  }

  return (
    <div className="container">
      <Link to="/matches" className="btn">
        ← Back to matches
      </Link>

      <h1 style={{ marginTop: 14 }}>
        {match.home_team} vs {match.away_team}
      </h1>

      <div className="kpi">
        <div className="pill">
          {match.score_home} : {match.score_away}
        </div>
        <div className={`badge ${match.status}`}>
          <span className="badgeDot" />
          {match.status}
        </div>
      </div>

      <hr />

      <h2>Match events</h2>

      {/* поки без адмін-форм (щоб не ламати) */}
      {adminMode && (
        <div className="muted" style={{ marginBottom: 10 }}>
          Admin mode enabled (event form can be added here)
        </div>
      )}

      <ul className="events">
        {events.map((e) => (
          <li key={e.event_id} className="eventItem">
            <div className="eventLeft">
              <div className="minute">{e.minute}'</div>
              <div>
                <div className="eventWho">{e.full_name}</div>
                <div className="eventTeam">{e.team_name}</div>
              </div>
            </div>
            <div className="eventType">{e.type}</div>
          </li>
        ))}

        {events.length === 0 && (
          <div className="muted">No events yet.</div>
        )}
      </ul>
    </div>
  );
}