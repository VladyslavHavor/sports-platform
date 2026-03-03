// src/integrations/apiSports/footballClient.js
require("dotenv").config();
const axios = require("axios");

const api = axios.create({
  baseURL: process.env.API_FOOTBALL_BASE,
  timeout: 15000,
  headers: { "x-apisports-key": process.env.API_SPORTS_KEY },
});

async function getPlayers({ team, season, page = 1 }) {
  const { data } = await api.get("/players", {
    params: { team, season, page },
  });
  return data; // важливо: тут є paging + response
}
async function getSquad(team) {
  const { data } = await api.get("/players/squads", { params: { team } });
  return data;
}
module.exports = { getPlayers, getSquad };
