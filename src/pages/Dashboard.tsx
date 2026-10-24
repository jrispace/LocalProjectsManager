import React, { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { getAllProjects } from "../lib/project";
import { getRegistry, getProjectData } from "../lib/storage";
import { calcStats } from "../lib/utils";
import { t } from "../lib/i18n";
import { copyReportToClipboard } from "../lib/report";
import DonutChart from "../components/DonutChart";
import SystemHealth from "../components/SystemHealth";
import ProjectDetailModal from "../components/ProjectDetailModal";

export default function Dashboard() {
  const { selectProject, config, refreshKey, showToast, setView } = useApp();
  const projects = getAllProjects();
  const [detailKey, setDetailKey] = useState<string | null>(null);

  const stats = useMemo(() => {
    let totalTasks = 0;
    let totalDone = 0;
    let totalOverdue = 0;
    let projectCount = projects.length;

    for (const p of projects) {
      const data = JSON.parse(localStorage.getItem(p.key) || "null");
      if (data && data.phases) {
        const s = calcStats(data.phases);
        totalTasks += s.total;
        totalDone += s.done;
        totalOverdue += s.overdue;
      }
    }

    return {
      projects: projectCount,
      tasks: totalTasks,
      done: totalDone,
      overdue: totalOverdue,
      pct: totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0,
    };
  }, [projects, refreshKey]);

  const handleCopyReport = async () => {
    try {
      const reg = getRegistry();
      await copyReportToClipboard(
        reg,
        (key) => JSON.parse(localStorage.getItem(key) || "null"),
      );
      showToast(t("dashboard.reportCopied"), "success");
    } catch {
      showToast("Failed to copy", "error");
    }
  };

  return (
    <div className="page active animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>
          {t("dashboard.welcome")}{config.author ? `, ${config.author}` : ""} <span role="wave">👋</span>
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>
          {t("dashboard.overview")}
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">{t("dashboard.totalProjects")}</div>
          <div className="stat-value cyan">{stats.projects}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t("dashboard.totalTasks")}</div>
          <div className="stat-value indigo">{stats.tasks}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t("dashboard.completed")}</div>
          <div className="stat-value emerald">{stats.done}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t("dashboard.overdue")}</div>
          <div className="stat-value" style={{ color: stats.overdue > 0 ? "#f87171" : "var(--text-primary)" }}>
            {stats.overdue}
          </div>
        </div>
      </div>

      {/* Progress + Donut */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">{t("dashboard.overallProgress")}</span>
          <span className="text-accent font-bold">{stats.pct}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${stats.pct}%` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <DonutChart pct={stats.pct} size={120} />
        </div>
      </div>

      {/* Recent Projects - Gallery */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">{t("dashboard.recentProjects")}</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={handleCopyReport}>
              📋 {t("dashboard.copyReport")}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setView("projects")}>
              {t("dashboard.viewAll")}
            </button>
          </div>
        </div>
        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📁</div>
            <div className="empty-state-title">{t("dashboard.noProjects")}</div>
            <div className="empty-state-desc">{t("dashboard.createFirst")}</div>
          </div>
        ) : (
          <div className="projects-grid gallery">
            {projects.slice(0, 6).map((p) => {
      const data = getProjectData(p.key);
              const s = data?.phases ? calcStats(data.phases) : { total: 0, done: 0, pct: 0, overdue: 0 };
              return (
                <div
                  key={p.key}
                  className="project-card gallery-card"
                  onClick={() => setDetailKey(p.key)}
                >
                  <div className="gallery-card-donut">
                    <DonutChart pct={s.pct} size={60} />
                  </div>
                  <div className="gallery-card-info">
                    <div className="pc-name">{p.name}</div>
                    <div className="pc-stats">
                      <span><span className="pc-stat-value">{s.done}</span>/{s.total} {t("common.tasks")}</span>
                      <span><span className="pc-stat-value">{s.pct}%</span></span>
                    </div>
                    {s.overdue > 0 && (
                      <div className="gallery-overdue">⚠️ {s.overdue} {t("dashboard.overdue")}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* System Health */}
      <div style={{ marginTop: 16 }}>
        <SystemHealth />
      </div>

      {/* Project Detail Modal */}
      {detailKey && (
        <ProjectDetailModal
          projectKey={detailKey}
          onClose={() => setDetailKey(null)}
        />
      )}
    </div>
  );
}
