import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { updateProject, addPhase, deleteProject as deleteProjectFn } from "../lib/project";
import { calcStats } from "../lib/utils";
import { addActivity, getRegistry } from "../lib/storage";
import { t } from "../lib/i18n";
import PhaseCard from "../components/PhaseCard";
import TaskBoard from "../components/TaskBoard";
import DonutChart from "../components/DonutChart";
import Modal from "../components/Modal";

export default function ProjectDetail() {
  const { selectedProject, setView, refresh, showToast, askConfirm, getProject, refreshKey } = useApp();
  const [addPhaseOpen, setAddPhaseOpen] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState("");
  const [newPhaseDesc, setNewPhaseDesc] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "board">("list");

  if (!selectedProject) {
    return (
      <div className="page active animate-fade-in">
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <div className="empty-state-title">{t("projects.none")}</div>
          <button className="btn btn-primary mt-4" onClick={() => setView("projects")}>{t("projects.goTo")}</button>
        </div>
      </div>
    );
  }

  const data = getProject(selectedProject);
  if (!data) {
    const entry = getRegistry().projects.find((p) => p.key === selectedProject);
    return (
      <div className="page active animate-fade-in">
        <div className="empty-state">
          <div className="empty-state-icon">❓</div>
          <div className="empty-state-title">
            {entry?.name || t("projects.notFound")}
          </div>
          <div className="empty-state-desc">{t("projects.notFoundDesc")}</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={() => setView("projects")}>{t("projects.goTo")}</button>
            {entry && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  deleteProjectFn(selectedProject);
                  refresh();
                  setView("projects");
                  showToast(t("projects.removeBroken"), "info");
                }}
              >
                {t("projects.removeBroken")}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const stats = calcStats(data.phases);
  const phaseNames = data.phases.map((p) => p.name);

  const handleAddPhase = () => {
    if (!newPhaseName.trim()) return;
    addPhase(selectedProject, newPhaseName.trim(), newPhaseDesc.trim());
    setNewPhaseName("");
    setNewPhaseDesc("");
    setAddPhaseOpen(false);
    refresh();
    showToast(t("phase.add"), "success");
  };

  const openEdit = () => {
    setEditName(data.project);
    setEditDesc("");
    setEditOpen(true);
  };

  const handleEdit = () => {
    if (!editName.trim()) return;
    updateProject(selectedProject, editName.trim(), editDesc.trim());
    setEditOpen(false);
    refresh();
    showToast(t("common.edit"), "success");
  };

  const handleDeleteProject = () => {
    askConfirm(`${t("projects.confirmDelete")} "${data.project}"? This cannot be undone.`, () => {
      addActivity({
        type: "deleted",
        text: `Deleted project: ${data.project}`,
        project: selectedProject,
        time: new Date().toISOString(),
      });
      deleteProjectFn(selectedProject);
      setView("projects");
      refresh();
      showToast(t("projects.delete"), "info");
    });
  };

  return (
    <div className="page active animate-fade-in">
      {/* Back button */}
      <button className="back-btn mb-4" onClick={() => setView("projects")}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        {t("projects.back")}
      </button>

      {/* Project Header */}
      <div className="card mb-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
                {data.project}
              </h2>
              <button className="btn-icon" onClick={openEdit} title={t("common.edit")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            </div>
            <p className="text-sm text-muted mt-2">
              {data.phases.length} {t("phase.title")}{data.phases.length !== 1 ? "s" : ""} · {stats.total} {t("common.tasks")}
            </p>
          </div>
          <DonutChart pct={stats.pct} />
        </div>

        {/* Stats row */}
        <div className="stats-grid mt-4">
          <div className="stat-card">
            <div className="stat-label">{t("dashboard.total")}</div>
            <div className="stat-value cyan">{stats.total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t("dashboard.completed")}</div>
            <div className="stat-value emerald">{stats.done}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t("tasks.remaining")}</div>
            <div className="stat-value indigo">{stats.total - stats.done}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t("common.overdue")}</div>
            <div className="stat-value" style={{ color: stats.overdue > 0 ? "#f87171" : "var(--text-primary)" }}>
              {stats.overdue}
            </div>
          </div>
        </div>
      </div>

      {/* Phases */}
      <div className="flex items-center justify-between mb-4">
        <div className="view-switch">
          <button className={`segment ${viewMode === "list" ? "on" : ""}`} onClick={() => setViewMode("list")}>
            {t("view.list")}
          </button>
          <button className={`segment ${viewMode === "board" ? "on" : ""}`} onClick={() => setViewMode("board")}>
            {t("view.board")}
          </button>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary btn-sm" onClick={() => setAddPhaseOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {t("phase.add")}
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            {t("projects.delete")}
          </button>
        </div>
      </div>

      {viewMode === "board" ? (
        <TaskBoard projectKey={selectedProject} data={data} refreshKey={refreshKey} />
      ) : data.phases.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">{t("phase.noPhases")}</div>
          <div className="empty-state-desc">{t("phase.addFirst")}</div>
        </div>
      ) : (
        data.phases.map((phase, pi) => (
          <PhaseCard
            key={`${selectedProject}-${pi}`}
            phase={phase}
            phaseIdx={pi}
            projectKey={selectedProject}
            phaseNames={phaseNames}
          />
        ))
      )}

      {/* Edit Project Modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t("common.edit")}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setEditOpen(false)}>{t("common.cancel")}</button>
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

      {/* Add Phase Modal */}
      <Modal
        open={addPhaseOpen}
        onClose={() => setAddPhaseOpen(false)}
        title={t("phase.add")}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setAddPhaseOpen(false)}>{t("common.cancel")}</button>
            <button className="btn btn-primary" onClick={handleAddPhase}>{t("phase.add")}</button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label className="text-xs text-muted">{t("phase.name")}</label>
            <input
              className="input"
              placeholder="e.g., Design, Development, Testing"
              value={newPhaseName}
              onChange={(e) => setNewPhaseName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddPhase()}
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-muted">{t("phase.description")}</label>
            <input
              className="input"
              placeholder="Brief description..."
              value={newPhaseDesc}
              onChange={(e) => setNewPhaseDesc(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
