import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { t } from "../i18n";
import { useAuth } from "../auth/AuthContext";

export default function Sidebar({
  tournaments = [],
  selectedId,
  onSelect,
  selectedSportId,
}) {
  const { lang } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const filteredTournaments = useMemo(() => {
    if (!selectedSportId) return tournaments;
    return tournaments.filter((x) => Number(x.sport_id) === Number(selectedSportId));
  }, [tournaments, selectedSportId]);

  const isStandingsPage = location.pathname.includes("/tournaments/");

  function handleAllLeagues() {
    onSelect(null);

    if (isStandingsPage) {
      navigate("/");
    }
  }

  function handleLeagueClick(id) {
    onSelect(id);

    if (isStandingsPage) {
      navigate("/");
    }
  }

  return (
    <div className="sidebar">
      <div className="sidebarTitle">{t(lang, "Tournaments")}</div>

      <button
        className={`sideItem ${selectedId === null ? "active" : ""}`}
        onClick={handleAllLeagues}
      >
        {t(lang, "allLeagues")}
      </button>

      <div className="sideList">
        {filteredTournaments.map((l) => (
          <button
            key={l.tournament_id}
            className={`sideItem ${
              Number(selectedId) === Number(l.tournament_id) ? "active" : ""
            }`}
            onClick={() => handleLeagueClick(l.tournament_id)}
          >
            <span className="sideDot" />
            <span>{l.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}