import axios from "axios";

export const API = axios.create({
  baseURL: "http://localhost:5000",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ NEW: sports
export async function getSports() {
  const { data } = await API.get("/sports");
  return data;
}

// matches with optional filters
export async function getMatches(params = {}) {
  const { data } = await API.get("/matches", { params });
  return data;
}

export async function getMatch(id) {
  const { data } = await API.get(`/matches/${id}`);
  return data;
}

export async function getMatchEvents(id) {
  const { data } = await API.get(`/matches/${id}/events`);
  return data;
}

export async function addEvent(id, payload) {
  const { data } = await API.post(`/matches/${id}/events`, payload);
  return data;
}

export async function getPlayersByMatch(id) {
  const { data } = await API.get(`/matches/${id}/players`);
  return data;
}

export async function getStandings(id) {
  const { data } = await API.get(`/tournaments/${id}/standings`);
  return data;
}

export async function getTournaments() {
  const { data } = await API.get("/tournaments");
  return data;
}

// auth
export async function register(payload) {
  const { data } = await API.post("/auth/register", payload);
  return data;
}
export async function login(payload) {
  const { data } = await API.post("/auth/login", payload);
  return data;
}
export async function me() {
  const { data } = await API.get("/auth/me");
  return data;
}

// favorites
export async function getFavorites() {
  const { data } = await API.get("/favorites");
  return data;
}

export async function addFavorite(teamId) {
  const { data } = await API.post(`/favorites/${teamId}`);
  return data;
}

export async function removeFavorite(teamId) {
  const { data } = await API.delete(`/favorites/${teamId}`);
  return data;
}