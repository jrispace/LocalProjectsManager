import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { t } from "../lib/i18n";
import type { Theme } from "../lib/theme";
import type { Lang } from "../lib/i18n";
import { isDiskConnected, getDiskFolder, connectDisk, backupDatabase, restoreDatabase } from "../lib/diskdb";
import { getCrm, savePerson, deletePerson, initials } from "../lib/crm";

export default function Settings() {
  const { config, updateConfig, theme, setTheme, lang, setLang, showToast, askConfirm } = useApp();
  const [localConfig, setLocalConfig] = useState({ ...config });
  const [people, setPeople] = useState(() => getCrm().people);
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonEmail, setNewPersonEmail] = useState("");

  const addPerson = () => {
    if (!newPersonName.trim()) return;
    savePerson({ name: newPersonName, email: newPersonEmail || undefined });
    setPeople(getCrm().people);
    setNewPersonName("");
    setNewPersonEmail("");
    showToast(t("common.save"), "success");
  };

  const handleSave = () => {
    updateConfig(localConfig);
    showToast(t("settings.save"), "success");
  };

  const handleDiskConnect = async () => {
    const ok = await connectDisk();
    if (ok) {
      showToast(t("db.connectSuccess"), "success");
    } else {
      showToast(t("common.error"), "error");
    }
  };

  const handleBackup = async () => {
    const name = await backupDatabase();
    if (name) {
      showToast(`${t("db.backup")}: ${name}`, "success");
    } else {
      showToast(t("common.error"), "error");
    }
  };

  const handleRestore = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".db,.json";
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const ok = await restoreDatabase(file);
      if (ok) {
        showToast(t("db.restoreSuccess"), "success");
        window.location.reload();
      } else {
        showToast(t("common.error"), "error");
      }
    };
    input.click();
  };

  const handleExport = () => {
    const data: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key) || "");
        } catch {
          data[key] = localStorage.getItem(key);
        }
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lpm-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Data exported", "success");
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          for (const [key, value] of Object.entries(data)) {
            localStorage.setItem(key, JSON.stringify(value));
          }
          showToast("Data imported successfully", "success");
          window.location.reload();
        } catch {
          showToast("Failed to import data", "error");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClear = () => {
    askConfirm("Are you sure you want to clear ALL data? This cannot be undone.", () => {
      localStorage.clear();
      showToast("All data cleared", "info");
      window.location.reload();
    });
  };

  return (
    <div className="page active animate-fade-in">
      <div className="mb-4">
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{t("settings.title")}</h2>
        <p className="text-sm text-muted">Manage your preferences</p>
      </div>

      <div className="settings-grid">
        {/* Profile / Branding */}
        <div className="settings-card">
          <div className="settings-card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            Profile
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label className="text-xs text-muted">{t("settings.company")}</label>
              <input
                className="input"
                value={localConfig.company}
                onChange={(e) => setLocalConfig({ ...localConfig, company: e.target.value })}
                placeholder="Company name"
              />
            </div>
            <div>
              <label className="text-xs text-muted">{t("settings.author")}</label>
              <input
                className="input"
                value={localConfig.author}
                onChange={(e) => setLocalConfig({ ...localConfig, author: e.target.value })}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="text-xs text-muted">{t("settings.website")}</label>
              <input
                className="input"
                value={localConfig.website}
                onChange={(e) => setLocalConfig({ ...localConfig, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <button className="btn btn-primary" onClick={handleSave}>{t("settings.save")}</button>
          </div>
        </div>

        {/* Appearance */}
        <div className="settings-card">
          <div className="settings-card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            {t("settings.theme")}
          </div>
          <div className="settings-row">
            <span className="settings-label">{t("settings.theme")}</span>
            <div className="flex gap-2">
              {(["dark", "light", "auto"] as Theme[]).map((t_) => (
                <button
                  key={t_}
                  className={`btn btn-sm ${theme === t_ ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setTheme(t_)}
                >
                  {t_ === "dark" ? t("settings.dark") : t_ === "light" ? t("settings.light") : t("settings.auto")}
                </button>
              ))}
            </div>
          </div>
          <div className="settings-row">
            <span className="settings-label">{t("settings.language")}</span>
            <div className="flex gap-2">
              {(["en", "ht", "fr"] as Lang[]).map((l) => (
                <button
                  key={l}
                  className={`btn btn-sm ${lang === l ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setLang(l)}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Local Disk Database */}
        <div className="settings-card">
          <div className="settings-card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
            Local Disk Database
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="settings-row">
              <span className="settings-label">Status</span>
              <span className={`text-sm font-semibold ${isDiskConnected() ? "text-emerald" : "text-amber"}`}>
                {isDiskConnected() ? `${t("db.connected")} (${getDiskFolder()})` : "Not connected"}
              </span>
            </div>
            <button className="btn btn-secondary w-full" onClick={handleDiskConnect}>
              {isDiskConnected() ? "Reconnect" : t("db.connect")}
            </button>
            {isDiskConnected() && (
              <>
                <button className="btn btn-secondary w-full" onClick={handleBackup}>
                  {t("db.backup")}
                </button>
                <button className="btn btn-secondary w-full" onClick={handleRestore}>
                  {t("db.restore")}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Data Management */}
        <div className="settings-card">
          <div className="settings-card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Export / Import
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button className="btn btn-secondary w-full" onClick={handleExport}>
              {t("export.json")} JSON
            </button>
            <button className="btn btn-secondary w-full" onClick={handleImport}>
              {t("import.json")} JSON
            </button>
            <button className="btn btn-danger w-full" onClick={handleClear}>
              Clear All Data
            </button>
          </div>
        </div>

        {/* Team (CRM people) */}
        <div className="settings-card">
          <div className="settings-card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Team
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {people.length === 0 && (
              <p className="text-xs text-muted">Add teammates to assign tasks, own deals and use My Tasks.</p>
            )}
            {people.map((person) => (
              <div key={person.id} className="settings-row">
                <span className="settings-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="avatar avatar-sm">{initials(person.name)}</span>
                  <span>
                    {person.name}
                    {person.email && <span className="text-xs text-muted" style={{ display: "block" }}>{person.email}</span>}
                  </span>
                </span>
                <button
                  className="btn-icon"
                  title={t("common.delete")}
                  onClick={() => { deletePerson(person.id); setPeople(getCrm().people); showToast(t("common.delete"), "info"); }}
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="Name"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addPerson(); }}
              />
              <input
                className="input"
                placeholder="Email (optional)"
                value={newPersonEmail}
                onChange={(e) => setNewPersonEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addPerson(); }}
              />
              <button className="btn btn-primary" onClick={addPerson}>+</button>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="settings-card">
          <div className="settings-card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            About
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="settings-row">
              <span className="settings-label">App Name</span>
              <span className="text-sm text-primary font-semibold">Local Projects Manager</span>
            </div>
            <div className="settings-row">
              <span className="settings-label">Version</span>
              <span className="text-sm text-secondary">2.0.0</span>
            </div>
            <div className="settings-row">
              <span className="settings-label">Author</span>
              <span className="text-sm text-secondary">Sylvenson Richard</span>
            </div>
            <div className="settings-row">
              <span className="settings-label">Agency</span>
              <span className="text-sm text-secondary">JRiSpace</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
