import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";

import HomePage from "./pages/HomePage";
import MatchesPage from "./pages/MatchesPage";
import MatchEventsPage from "./pages/MatchEventsPage";
import StandingsPage from "./pages/StandingsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

import { getTournaments, getSports } from "./api";
import { AuthProvider, useAuth } from "./auth/AuthContext";

function AppShell() {
  const { user } = useAuth();

  const [sports, setSports] = useState([]);
  const [tournaments, setTournaments] = useState([]);

  const [selectedSportId, setSelectedSportId] = useState(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState(null);

  const [adminMode, setAdminMode] = useState(false);
  const canAdmin = user?.role === "admin";

  useEffect(() => {
    getTournaments().then(setTournaments).catch(() => setTournaments([]));
  }, []);

  useEffect(() => {
  getSports()
  .then((rows) => {
    const list = rows || [];

    // Football першим
    const sorted = [...list].sort((a, b) => {
      const A = String(a.name).toLowerCase();
      const B = String(b.name).toLowerCase();
      if (A === "football") return -1;
      if (B === "football") return 1;
      return A.localeCompare(B);
    });

    setSports(sorted);

    const football = sorted.find((s) => String(s.name).toLowerCase() === "football");
    setSelectedSportId(football ? football.sport_id : sorted?.[0]?.sport_id ?? null);
  })
  .catch(() => setSports([]));
  }, []);

  useEffect(() => {
    if (user?.role !== "admin") setAdminMode(false);
  }, [user]);

  function handleSelectSport(id) {
    setSelectedSportId(id);
    setSelectedLeagueId(null); // скидаємо лігу при зміні спорту
  }

  return (
    <div className="appLayout">
      <TopBar
        sports={sports}
        selectedSportId={selectedSportId}
        onSelectSport={handleSelectSport}
      />

      <div className="mainArea">
        <Sidebar
          tournaments={tournaments}
          selectedId={selectedLeagueId}
          onSelect={setSelectedLeagueId}
          selectedSportId={selectedSportId}
        />

        <div className="content">
          {canAdmin && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
              <label className="btn" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={adminMode}
                  onChange={(e) => setAdminMode(e.target.checked)}
                />
                Admin mode
              </label>
            </div>
          )}

          <Routes>
            <Route
              path="/"
              element={<HomePage selectedSportId={selectedSportId} selectedLeagueId={selectedLeagueId} />}
            />
            <Route
              path="/matches"
              element={<MatchesPage selectedSportId={selectedSportId} selectedLeagueId={selectedLeagueId} />}
            />
            <Route path="/matches/:id" element={<MatchEventsPage adminMode={adminMode} />} />
            <Route path="/tournaments/:id/standings" element={<StandingsPage />} />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}