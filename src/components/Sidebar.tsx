import React from "react";
import { useApp } from "../context/AppContext";
import { t, cycleLang, getLangLabel, type Lang } from "../lib/i18n";
import { cycleTheme, getThemeLabel, type Theme } from "../lib/theme";

const icons = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  projects: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  checklist: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  tasks: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  activity: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  crm: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V8l7-5 7 5v13"/><path d="M9 21v-6h6v6"/></svg>,
  wizard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  collapse: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>,
  theme: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  lang: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
};

const NAV_ITEMS = [
  { view: "dashboard" as const, key: "nav.dashboard", icon: icons.dashboard },
  { view: "mytasks" as const, key: "nav.mytasks", icon: icons.tasks },
  { view: "projects" as const, key: "nav.projects", icon: icons.projects },
  { view: "crm" as const, key: "nav.crm", icon: icons.crm },
  { view: "checklist" as const, key: "nav.checklist", icon: icons.checklist },
  { view: "activity" as const, key: "nav.activity", icon: icons.activity },
  { view: "settings" as const, key: "nav.settings", icon: icons.settings },
  { view: "wizard" as const, key: "nav.wizard", icon: icons.wizard },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

export default function Sidebar({ collapsed, onToggle, className = "sidebar" }: SidebarProps) {
  const { view, setView, selectProject, openWizard, config, theme, setTheme, lang, setLang, goToLanding } = useApp();

  const handleNav = (v: string) => {
    if (v === "projects") {
      selectProject(null);
    } else if (v === "wizard") {
      openWizard();
    } else {
      setView(v as any);
    }
  };

  const handleThemeCycle = () => {
    const next = cycleTheme();
    setTheme(next);
  };

  const handleLangCycle = () => {
    const next = cycleLang();
    setLang(next);
  };

  return (
    <aside className={`${className} ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header" onClick={goToLanding} title="Back to homepage" style={{ cursor: "pointer" }}>
        <img src={`${import.meta.env.BASE_URL}icons/lpm-logo.png`} alt="LPM" className="sidebar-logo" />
        <div className="sidebar-brand">
          <h1>{config.company || "Project Manager"}</h1>
          <p>{config.author || "JRiSpace"}</p>
        </div>
      </div>

      <div className="sidebar-section-label">Navigation</div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {NAV_ITEMS.map((item) => (
            <div
              key={item.view}
              className={`nav-item ${view === item.view ? "active" : ""}`}
              onClick={() => handleNav(item.view)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{t(item.key)}</span>
            </div>
          ))}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-utils">
          <div className="nav-item" onClick={handleThemeCycle} title={`Theme: ${getThemeLabel(theme)}`}>
            <span className="nav-icon">{icons.theme}</span>
            <span>{getThemeLabel(theme)}</span>
          </div>
          <div className="nav-item" onClick={handleLangCycle} title={`Language: ${getLangLabel(lang)}`}>
            <span className="nav-icon">{icons.lang}</span>
            <span>{getLangLabel(lang)}</span>
          </div>
        </div>
        {onToggle && (
          <div className="nav-item" onClick={onToggle}>
            <span className="nav-icon">{icons.collapse}</span>
            <span>Collapse</span>
          </div>
        )}
      </div>
    </aside>
  );
}
