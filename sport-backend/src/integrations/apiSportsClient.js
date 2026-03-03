// src/integrations/apiSportsClient.js
require("dotenv").config();
const axios = require("axios");

const api = axios.create({
  baseURL: process.env.API_SPORTS_BASE,
  timeout: 15000,
  headers: {
    "x-apisports-key": process.env.API_SPORTS_KEY,
    "x-rapidapi-host": process.env.API_SPORTS_HOST, // інколи не треба, але хай буде
  },
});

// Football: teams by league+season
async function getTeams({ league, season }) {
  const { data } = await api.get("/teams", { params: { league, season } });
  return data.response; // масив
}

// Football: fixtures (matches) by league+season
async function getFixtures({ league, season }) {
  const { data } = await api.get("/fixtures", { params: { league, season } });
  return data.response; // масив
}

module.exports = { getTeams, getFixtures };