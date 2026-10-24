import React from "react";
import { useApp } from "../context/AppContext";
import { t, cycleLang, getLangLabel } from "../lib/i18n";
import { cycleTheme, getThemeLabel } from "../lib/theme";

const icons = {
  theme: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  lang: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
};

export default function MobileDrawer() {
  const { drawerOpen, setDrawerOpen, view, setView, selectProject, openWizard, config, theme, setTheme, lang, setLang } = useApp();

  const handleNav = (v: string) => {
    if (v === "projects") {
      selectProject(null);
    } else if (v === "wizard") {
      openWizard();
    } else {
      setView(v as any);
    }
    setDrawerOpen(false);
  };

  const items = [
    { view: "dashboard", key: "nav.dashboard" },
    { view: "projects", key: "nav.projects" },
    { view: "checklist", key: "nav.checklist" },
    { view: "tasks", key: "nav.tasks" },
    { view: "activity", key: "nav.activity" },
    { view: "settings", key: "nav.settings" },
    { view: "wizard", key: "nav.wizard" },
  ];

  return (
    <>
      <div
        className={`sidebar-mobile-overlay ${drawerOpen ? "show" : ""}`}
        onClick={() => setDrawerOpen(false)}
      />
      <aside className={`sidebar-mobile ${drawerOpen ? "show" : ""}`}>
        <div className="sidebar-header">
          <img src="/icons/lpm-logo.png" alt="LPM" className="sidebar-logo" />
          <div className="sidebar-brand">
            <h1>{config.company || "Project Manager"}</h1>
            <p>{config.author || "JRiSpace"}</p>
          </div>
        </div>
        <nav className="sidebar-nav">
          {items.map((item) => (
            <div
              key={item.view}
              className={`nav-item ${view === item.view ? "active" : ""}`}
              onClick={() => handleNav(item.view)}
            >
              <span>{t(item.key)}</span>
            </div>
          ))}
        </nav>
        <div className="sidebar-footer" style={{ padding: "16px", display: "flex", gap: "8px" }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              const next = cycleTheme();
              setTheme(next);
            }}
            title={`Theme: ${getThemeLabel(theme)}`}
          >
            <span className="nav-icon">{icons.theme}</span>
            <span>{getThemeLabel(theme)}</span>
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              const next = cycleLang();
              setLang(next);
            }}
            title={`Language: ${getLangLabel(lang)}`}
          >
            <span className="nav-icon">{icons.lang}</span>
            <span>{getLangLabel(lang)}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
