import React from "react";
import { useApp } from "../context/AppContext";

export default function Header() {
  const { view, setView, selectedProject, getProject, theme, setTheme, setDrawerOpen, config } = useApp();

  const titles: Record<string, string> = {
    dashboard: "Dashboard",
    projects: "Projects",
    project: "",
    checklist: "Checklist",
    tasks: "All Tasks",
    activity: "Activity Log",
    settings: "Settings",
    wizard: "Setup Wizard",
  };

  let title = titles[view] || "Dashboard";
  if (view === "project" && selectedProject) {
    const p = getProject(selectedProject);
    title = p?.project || "Project";
  }

  const initials = config.author
    ? config.author.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <header className="top-header">
      <div className="header-left">
        <button className="menu-toggle" onClick={() => setDrawerOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <span className="header-title">{title}</span>
      </div>
      <div className="header-right">
        <button
          className="theme-toggle"
          onClick={() => setTheme(theme === "dark" ? "light" : theme === "light" ? "auto" : "dark")}
          title={`Theme: ${theme}`}
        >
          {theme === "dark" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : theme === "light" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 0 0 20z" fill="currentColor" opacity="0.3"/>
            </svg>
          )}
        </button>
        <button className="profile-btn">{initials}</button>
      </div>
    </header>
  );
}
