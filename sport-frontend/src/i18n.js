export const dict = {
  ua: {
    dashboard: "Панель",
    matches: "Матчі",
    favorites: "Обране",
    allLeagues: "Всі ліги",
    status: "Статус",
    all: "Усі",
    scheduled: "заплан.",
    live: "наживо",
    finished: "заверш.",
    login: "Вхід",
    register: "Реєстрація",
    logout: "Вийти",
    adminTools: "Адмін",
    addEvent: "Додати подію",
  },
  en: {
    dashboard: "Dashboard",
    matches: "Matches",
    favorites: "Favorites",
    allLeagues: "All leagues",
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
  },
};

export function t(lang, key) {
  return dict[lang]?.[key] || key;
}