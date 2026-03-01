import React, { createContext, useContext, useEffect, useState } from "react";
import { API, me, login, register } from "../api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState(localStorage.getItem("lang") || "ua");

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      API.defaults.headers.common.Authorization = `Bearer ${token}`;
      me().then(setUser).catch(() => setUser(null));
    }
  }, []);

  async function doLogin(email, password) {
    const { token, user } = await login({ email, password });
    localStorage.setItem("token", token);
    API.defaults.headers.common.Authorization = `Bearer ${token}`;
    setUser(user);
  }

  async function doRegister(username, email, password) {
    const { token, user } = await register({ username, email, password });
    localStorage.setItem("token", token);
    API.defaults.headers.common.Authorization = `Bearer ${token}`;
    setUser(user);
  }

  function logout() {
    localStorage.removeItem("token");
    delete API.defaults.headers.common.Authorization;
    setUser(null);
  }

  return (
    <AuthCtx.Provider value={{ user, setUser, doLogin, doRegister, logout, lang, setLang }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}