import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";

import HomePage from "./pages/HomePage";
import MatchesPage from "./pages/MatchesPage";
import MatchEventsPage from "./pages/MatchEventsPage";
import StandingsPage from "./pages/StandingsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

import { getTournaments } from "./api";
import { AuthProvider, useAuth } from "./auth/AuthContext";

function AppShell() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState(null);

  // admin mode тільки якщо адмін
  const [adminMode, setAdminMode] = useState(false);

  useEffect(() => {
    getTournaments().then(setTournaments).catch(() => setTournaments([]));
  }, []);

  useEffect(() => {
    if (user?.role !== "admin") setAdminMode(false);
  }, [user]);

  const canAdmin = user?.role === "admin";

  return (
    <div className="appLayout">
      <TopBar />

      <div className="mainArea">
        <Sidebar
          tournaments={tournaments}
          selectedId={selectedLeagueId}
          onSelect={setSelectedLeagueId}
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
            <Route path="/" element={<HomePage selectedLeagueId={selectedLeagueId} />} />
            <Route path="/matches" element={<MatchesPage selectedLeagueId={selectedLeagueId} />} />
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