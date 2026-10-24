import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { getChecklist, saveChecklist, getRegistry } from "../lib/storage";
import { t } from "../lib/i18n";

export default function Checklist() {
  const { refresh, showToast, refreshKey } = useApp();
  const [newItem, setNewItem] = useState("");
  const [activeProject, setActiveProject] = useState<string>("global");

  const projects = useMemo(() => {
    return getRegistry().projects || [];
  }, [refreshKey]);

  const items = useMemo(() => {
    return getChecklist(activeProject);
  }, [activeProject, refreshKey]);

  const handleAdd = () => {
    if (!newItem.trim()) return;
    const updated = [...items, newItem.trim()];
    saveChecklist(activeProject, updated);
    setNewItem("");
    refresh();
  };

  const handleToggle = (idx: number) => {
    const updated = [...items];
    updated.splice(idx, 1);
    saveChecklist(activeProject, updated);
    refresh();
  };

  const handleDelete = (idx: number) => {
    const updated = [...items];
    updated.splice(idx, 1);
    saveChecklist(activeProject, updated);
    refresh();
    showToast(t("common.delete"), "info");
  };

  return (
    <div className="page active animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{t("checklist.title")}</h2>
          <p className="text-sm text-muted">{items.length} {items.length !== 1 ? t("common.items") : t("common.item")}</p>
        </div>
      </div>

      {/* Project filter */}
      <div className="card mb-4">
        <div className="flex items-center gap-2 mb-2">
          <label className="text-xs text-muted">{t("checklist.filterByProject")}</label>
        </div>
        <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
          <button
            className={`btn btn-sm ${activeProject === "global" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveProject("global")}
          >
            {t("checklist.allProjects")}
          </button>
          {projects.map((p: any) => (
            <button
              key={p.key}
              className={`btn btn-sm ${activeProject === p.key ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveProject(p.key)}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Add item */}
      <div className="card mb-4">
        <div className="flex gap-2">
          <input
            className="input"
            placeholder={t("checklist.addItem")}
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <button className="btn btn-primary" onClick={handleAdd}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {t("checklist.add")}
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="checklist-card">
        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <div className="empty-state-title">{t("checklist.noItems")}</div>
            <div className="empty-state-desc">{t("checklist.addItems")}</div>
          </div>
        ) : (
          items.map((item, idx) => (
            <div key={idx} className="checklist-item">
              <div className="task-checkbox" onClick={() => handleToggle(idx)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <span className="task-text flex-1">{item}</span>
              <button className="task-delete btn-icon" onClick={() => handleDelete(idx)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
