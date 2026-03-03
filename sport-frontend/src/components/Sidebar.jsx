import React, { useMemo } from "react";
import { t } from "../i18n";
import { useAuth } from "../auth/AuthContext";

export default function Sidebar({ tournaments = [], selectedId, onSelect, selectedSportId }) {
  const { lang } = useAuth();

  const filteredTournaments = useMemo(() => {
    if (!selectedSportId) return tournaments;
    return tournaments.filter((x) => Number(x.sport_id) === Number(selectedSportId));
  }, [tournaments, selectedSportId]);

  return (
    <div className="sidebar">
      <div className="sidebarTitle">{t(lang, "Tournaments")}</div>

      <button
        className={`sideItem ${selectedId === null ? "active" : ""}`}
        onClick={() => onSelect(null)}
      >
        {t(lang, "allLeagues")}
      </button>

      <div className="sideList">
        {filteredTournaments.map((l) => (
          <button
            key={l.tournament_id}
            className={`sideItem ${selectedId === l.tournament_id ? "active" : ""}`}
            onClick={() => onSelect(l.tournament_id)}
          >
            <span className="sideDot" />
            <span>{l.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}