import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { createProject, deleteProject as deleteProjectFn, duplicateProject, renameProject, updateProject } from "../lib/project";
import { calcStats } from "../lib/utils";
import { addActivity, getRegistry, getProjectData } from "../lib/storage";
import { t } from "../lib/i18n";
import Modal from "../components/Modal";

export default function Projects() {
  const { selectProject, refresh, showToast, askConfirm, refreshKey } = useApp();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [renameOpen, setRenameOpen] = useState<{ key: string; name: string } | null>(null);
  const [renameName, setRenameName] = useState("");
  const [editOpen, setEditOpen] = useState<{ key: string; name: string; desc: string } | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const projects = useMemo(() => {
    return getRegistry().projects || [];
  }, [refreshKey]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const key = createProject(newName.trim(), newDesc.trim());
    addActivity({
      type: "created",
      text: `Created project: ${newName.trim()}`,
      project: key,
      time: new Date().toISOString(),
    });
    setNewName("");
    setNewDesc("");
    setCreateOpen(false);
    refresh();
    showToast(t("projects.new"), "success");
    selectProject(key);
  };

  const handleDelete = (key: string, name: string) => {
    askConfirm(t("projects.confirmDelete"), () => {
      deleteProjectFn(key);
      addActivity({
        type: "deleted",
        text: `Deleted project: ${name}`,
        project: key,
        time: new Date().toISOString(),
      });
      refresh();
      showToast(t("common.delete"), "info");
    });
    setMenuOpen(null);
  };

  const handleDuplicate = (key: string, name: string) => {
    const newKey = duplicateProject(key, `${name} (Copy)`);
    addActivity({
      type: "created",
      text: `Duplicated project: ${name}`,
      project: newKey,
      time: new Date().toISOString(),
    });
    refresh();
    showToast(t("projects.duplicate"), "success");
    setMenuOpen(null);
  };

  const handleRename = (key: string) => {
    if (!renameName.trim()) return;
    renameProject(key, renameName.trim());
    refresh();
    showToast(t("projects.rename"), "success");
    setRenameOpen(null);
  };

  const openEdit = (key: string, name: string, desc: string) => {
    setEditOpen({ key, name, desc });
    setEditName(name);
    setEditDesc(desc);
    setMenuOpen(null);
  };

  const handleEdit = () => {
    if (!editOpen || !editName.trim()) return;
    updateProject(editOpen.key, editName.trim(), editDesc.trim());
    refresh();
    showToast(t("common.edit"), "success");
    setEditOpen(null);
  };

  return (
    <div className="page active animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{t("projects.title")}</h2>
          <p className="text-sm text-muted">{projects.length} {t("common.items")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {t("projects.new")}
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <div className="empty-state-title">{t("projects.noProjects")}</div>
          <div className="empty-state-desc">{t("projects.createFirst")}</div>
          <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>{t("projects.new")}</button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((p: any) => {
            const data = getProjectData(p.key);
            const s = data?.phases ? calcStats(data.phases) : { total: 0, done: 0, pct: 0, overdue: 0 };
            return (
              <div key={p.key} className="project-card" onClick={() => selectProject(p.key)}>
                <div className="flex items-center justify-between mb-2">
                  <span className="pc-name">{p.name}</span>
                  <div style={{ position: "relative", display: "flex", gap: 4 }}>
                    <button
                      className="btn-icon"
                      onClick={(e) => { e.stopPropagation(); openEdit(p.key, p.name, p.desc || ""); }}
                      title={t("common.edit")}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button
                      className="btn-icon"
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === p.key ? null : p.key); }}
                      title="Options"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                      </svg>
                    </button>
                    {menuOpen === p.key && (
                      <div className="context-menu" onClick={(e) => e.stopPropagation()}>
                        <div className="context-menu-item" onClick={() => openEdit(p.key, p.name, p.desc || "")}>
                          {t("common.edit")}
                        </div>
                        <div className="context-menu-item" onClick={() => { setRenameOpen({ key: p.key, name: p.name }); setRenameName(p.name); setMenuOpen(null); }}>
                          {t("projects.rename")}
                        </div>
                        <div className="context-menu-item" onClick={() => handleDuplicate(p.key, p.name)}>
                          {t("projects.duplicate")}
                        </div>
                        <div className="context-menu-item danger" onClick={() => handleDelete(p.key, p.name)}>
                          {t("projects.delete")}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {p.desc && <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8, lineHeight: 1.4 }}>{p.desc}</div>}
                <div className="pc-stats mb-2">
                  <span><span className="pc-stat-value">{s.done}</span>/{s.total} {t("common.tasks")}</span>
                  <span><span className="pc-stat-value">{s.pct}%</span></span>
                </div>
                {s.overdue > 0 && (
                  <div style={{ fontSize: 12, color: "#f87171", marginTop: 4 }}>⚠️ {s.overdue} overdue</div>
                )}
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t("projects.new")}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setCreateOpen(false)}>{t("common.cancel")}</button>
            <button className="btn btn-primary" onClick={handleCreate}>{t("common.save")}</button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label className="text-xs text-muted">Project Name</label>
            <input
              className="input"
              placeholder="My awesome project"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-muted">{t("phase.description")}</label>
            <textarea
              className="input"
              placeholder="Brief description of the project..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      {editOpen && (
        <Modal
          open={true}
          onClose={() => setEditOpen(null)}
          title={t("common.edit")}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setEditOpen(null)}>{t("common.cancel")}</button>
              <button className="btn btn-primary" onClick={handleEdit}>{t("common.save")}</button>
            </>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label className="text-xs text-muted">Project Name</label>
              <input
                className="input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEdit()}
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs text-muted">{t("phase.description")}</label>
              <textarea
                className="input"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Rename Modal */}
      {renameOpen && (
        <Modal
          open={true}
          onClose={() => setRenameOpen(null)}
          title={t("projects.rename")}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setRenameOpen(null)}>{t("common.cancel")}</button>
              <button className="btn btn-primary" onClick={() => handleRename(renameOpen.key)}>{t("common.save")}</button>
            </>
          }
        >
          <div>
            <label className="text-xs text-muted">New Name</label>
            <input
              className="input"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRename(renameOpen.key)}
              autoFocus
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
