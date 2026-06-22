export const dict = {
  ua: {
    Tournaments: "Турніри",
    sport: "Спорт",
    dashboard: "Панель",
    matches: "Матчі",
    matchesHint: "Усі матчі. Можна фільтрувати за статусом.",
    dashboardHint: "Тут відображається коротка статистика та швидкі дії",
    placeholder: "Пошук команди або турніру...",
    matches: "Матчі",
    favorites: "Обране",
    allLeagues: "Всі ліги",
    league: "Ліга",
    status: "Статус",
    all: "Усі",
    scheduled: "Заплановано",
    live: "Наживо",
    finished: "Завершено",
    login: "Вхід",
    register: "Реєстрація",
    logout: "Вийти",
    adminTools: "Адмін",
    addEvent: "Додати подію",
    football: "Футбол",
    basketball: "Баскетбол",
    esports: "Кіберспорт",
    hockey: "Хокей",
    tennis: "Теніс",
    volleyball: "Волейбол",
    // dashboard text
    searchPlaceholder: "Пошук команди або турніру...",
    quickOverview: "Короткий огляд. Фільтр за лігою та статусом матчу.",
    total: "Всього",
    liveNow: "Наживо",
    today: "Сьогодні",
    reset: "Скинути",
    allMatches: "Усі матчі",
matches: {
  ua: "Матчів",
  en: "Matches",
},

wins: {
  ua: "Перемог",
  en: "Wins",
},

draws: {
  ua: "Нічиїх",
  en: "Draws",
},

losses: {
  ua: "Поразок",
  en: "Losses",
},

goalsScored: {
  ua: "Голів забито",
  en: "Goals Scored",
},

goalsConceded: {
  ua: "Голів пропущено",
  en: "Goals Conceded",
},

last5Matches: {
  ua: "Останні 5 матчів",
  en: "Last 5 Matches",
},

recentMatches: {
  ua: "Останні матчі",
  en: "Recent Matches",
},
    // common
    viewStandings: "Таблиця",
    routeNotFound: "Маршрут не знайдено",
  },

  en: {
    dashboard: "Dashboard",
    dashboardHint: "Quick stats and shortcuts are shown here",
    matches: "Matches",
    favorites: "Favorites",
    allLeagues: "All leagues",
    league: "League",
    status: "Status",
    all: "All",
    scheduled: "Scheduled",
    live: "Live",
    finished: "Finished",
    login: "Login",

    register: "Register",
    logout: "Logout",
    adminTools: "Admin",
    addEvent: "Add event",
searchPlaceholder: "Searching for a team or tournament...",
    quickOverview: "Quick overview. Filter by league and match status.",
    total: "Total",
    liveNow: "Live now",
    today: "Today",
    reset: "Reset",
    allMatches: "All matches",
    football: "Football",
    basketball: "Basketball",
    esports: "Esports",
    hockey: "Hockey",
    tennis: "Tennis",
    volleyball: "Volleyball",
    viewStandings: "View standings",
    routeNotFound: "Route not found",
  },

  de: {
    dashboard: "Übersicht",
    dashboardHint: "Hier sehen Sie Spielstatistiken, Live-Ereignisse und schnellen Zugriff auf Turniere.",
    matches: "Spiele",
    favorites: "Favoriten",
    allLeagues: "Alle Ligen",
    league: "Liga",
    status: "Status",
    all: "Alle",
    scheduled: "Geplant",
    live: "Live",
    finished: "Beendet",
    login: "Anmelden",
    register: "Registrieren",
    logout: "Abmelden",
    adminTools: "Admin",
    addEvent: "Ereignis hinzufügen",

    quickOverview: "Kurzübersicht. Filter nach Liga und Spielstatus.",
    total: "Gesamt",
    liveNow: "Jetzt live",
    today: "Heute",
    reset: "Zurücksetzen",
    allMatches: "Alle Spiele",

    viewStandings: "Tabelle",
    routeNotFound: "Route nicht gefunden",
  },

  es: {
    dashboard: "Panel",
    dashboardHint: "Aquí puedes ver estadísticas de partidos, eventos en vivo y acceso rápido a los torneos.",
    matches: "Partidos",
    favorites: "Favoritos",
    allLeagues: "Todas las ligas",
    league: "Liga",
    status: "Estado",
    all: "Todos",
    scheduled: "Programado",
    live: "En vivo",
    finished: "Finalizado",
    login: "Iniciar sesión",
    register: "Registrarse",
    logout: "Cerrar sesión",
    adminTools: "Admin",
    addEvent: "Agregar evento",

    quickOverview: "Resumen rápido. Filtra por liga y estado del partido.",
    total: "Total",
    liveNow: "En vivo",
    today: "Hoy",
    reset: "Restablecer",
    allMatches: "Todos los partidos",

    viewStandings: "Tabla",
    routeNotFound: "Ruta no encontrada",

    
  },
};

export function t(lang, key) {
  // fallback: lang -> en -> key
  return dict?.[lang]?.[key] ?? dict?.en?.[key] ?? key;
}