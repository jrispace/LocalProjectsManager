import React from "react";
import { useApp } from "../context/AppContext";
import { getProjectData } from "../lib/storage";
import { calcStats } from "../lib/utils";
import { t } from "../lib/i18n";

interface ProjectDetailModalProps {
  projectKey: string;
  onClose: () => void;
}

export default function ProjectDetailModal({ projectKey, onClose }: ProjectDetailModalProps) {
  const { selectProject, refreshKey } = useApp();
  const data = getProjectData(projectKey);

  if (!data) {
    return (
      <>
        <div className="modal-overlay" onClick={onClose} />
        <div className="modal animate-scale-in">
          <div className="modal-header">
            <h3>{t("common.error")}</h3>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
          <div className="modal-body">
            <p>{t("common.error")}</p>
          </div>
        </div>
      </>
    );
  }

  const stats = calcStats(data.phases);
  const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  const handleOpen = () => {
    selectProject(projectKey);
    onClose();
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal animate-scale-in" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <h3>{data.project}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {/* Progress summary */}
          <div className="detail-progress">
            <div className="detail-progress-bar">
              <div className="detail-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="detail-progress-text">{pct}% — {stats.done}/{stats.total} {t("common.tasks")}</span>
          </div>

          {/* Phases table */}
          <div className="detail-phases">
            <h4>{t("detail.phases")}</h4>
            <table className="detail-table">
              <thead>
                <tr>
                  <th>{t("detail.phases")}</th>
                  <th>{t("detail.tasks")}</th>
                  <th>{t("detail.progress")}</th>
                </tr>
              </thead>
              <tbody>
                {data.phases.map((phase, idx) => {
                  const phaseStats = calcStats([phase]);
                  const phasePct = phaseStats.total > 0 ? Math.round((phaseStats.done / phaseStats.total) * 100) : 0;
                  return (
                    <tr key={idx}>
                      <td>{phase.name}</td>
                      <td>{phaseStats.done}/{phaseStats.total}</td>
                      <td>
                        <div className="detail-mini-bar">
                          <div className="detail-mini-fill" style={{ width: `${phasePct}%` }} />
                        </div>
                        <span className="detail-mini-pct">{phasePct}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Tasks breakdown */}
          <div className="detail-tasks">
            <h4>{t("detail.tasks")}</h4>
            {data.phases.map((phase, phaseIdx) => (
              <div key={phaseIdx} className="detail-phase-tasks">
                <div className="detail-phase-name">{phase.name}</div>
                {phase.tasks.length === 0 ? (
                  <div className="detail-no-tasks">{t("phase.noTasks")}</div>
                ) : (
                  phase.tasks.map((task, taskIdx) => (
                    <div key={taskIdx} className={`detail-task ${task.done ? "done" : ""}`}>
                      <span className="detail-task-check">{task.done ? "✓" : "○"}</span>
                      <span className="detail-task-text">{task.text}</span>
                      {task.priority === "high" && <span className="detail-task-priority">🔴</span>}
                      {task.priority === "med" && <span className="detail-task-priority">🟡</span>}
                      {task.priority === "low" && <span className="detail-task-priority">🟢</span>}
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>{t("common.close")}</button>
          <button className="btn btn-primary" onClick={handleOpen}>{t("detail.openChecklist")}</button>
        </div>
      </div>
    </>
  );
}
