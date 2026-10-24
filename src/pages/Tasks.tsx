import React, { useMemo } from "react";
import { useApp } from "../context/AppContext";
import { getRegistry, getProjectData } from "../lib/storage";
import { t } from "../lib/i18n";

export default function Tasks() {
  const { selectProject, refreshKey } = useApp();

  const projects = useMemo(() => {
    return getRegistry().projects || [];
  }, [refreshKey]);

  const allTasks = useMemo(() => {
    const tasks: Array<{
      text: string;
      done: boolean;
      priority?: string;
      dueDate?: string;
      projectName: string;
      projectKey: string;
      phaseName: string;
      subtaskCount: number;
      overdue: boolean;
    }> = [];

    for (const p of projects) {
      const data = getProjectData(p.key);
      if (!data || !data.phases) continue;

      for (const phase of data.phases) {
        for (const task of phase.tasks) {
          const overdue = !!(task.dueDate && new Date(task.dueDate) < new Date() && !task.done);
          tasks.push({
            text: task.text,
            done: task.done,
            priority: task.priority,
            dueDate: task.dueDate,
            projectName: data.project,
            projectKey: p.key,
            phaseName: phase.name,
            subtaskCount: task.subtasks?.length || 0,
            overdue,
          });
        }
      }
    }

    return tasks;
  }, [projects, refreshKey]);

  const incompleteTasks = allTasks.filter((t) => !t.done);
  const completedTasks = allTasks.filter((t) => t.done);

  const priorityOrder: Record<string, number> = { high: 0, med: 1, low: 2 };
  incompleteTasks.sort((a, b) => {
    const pa = priorityOrder[a.priority || ""] ?? 3;
    const pb = priorityOrder[b.priority || ""] ?? 3;
    return pa - pb;
  });

  return (
    <div className="page active animate-fade-in">
      <div className="mb-4">
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{t("tasks.title")}</h2>
        <p className="text-sm text-muted">
          {incompleteTasks.length} incomplete · {completedTasks.length} completed
        </p>
      </div>

      {/* Incomplete Tasks */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">{t("common.tasks")} ({incompleteTasks.length})</span>
        </div>
        {incompleteTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎉</div>
            <div className="empty-state-title">All caught up!</div>
            <div className="empty-state-desc">{t("tasks.noTasks")}</div>
          </div>
        ) : (
          incompleteTasks.map((task, idx) => (
            <div
              key={idx}
              className="task-item"
              style={{ cursor: "pointer" }}
              onClick={() => selectProject(task.projectKey)}
            >
              <div className={`task-checkbox ${task.done ? "checked" : ""}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <span className={`task-text ${task.done ? "done" : ""}`}>{task.text}</span>
              {task.priority && (
                <span className={`priority-badge ${task.priority}`}>
                  {task.priority === "high" ? "🔴" : task.priority === "med" ? "🟠" : "🟢"} {task.priority}
                </span>
              )}
              {task.overdue && (
                <span className="due-badge overdue">⚠️ {t("overdue.yes")}</span>
              )}
              {task.dueDate && !task.overdue && (
                <span className="due-badge">{task.dueDate}</span>
              )}
              {task.subtaskCount > 0 && (
                <span className="subtask-badge">{task.subtaskCount} subtasks</span>
              )}
              <span className="text-xs text-muted">{task.projectName} › {task.phaseName}</span>
            </div>
          ))
        )}
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">{t("dashboard.completed")} ({completedTasks.length})</span>
          </div>
          {completedTasks.slice(0, 20).map((task, idx) => (
            <div
              key={idx}
              className="task-item"
              style={{ cursor: "pointer", opacity: 0.6 }}
              onClick={() => selectProject(task.projectKey)}
            >
              <div className="task-checkbox checked">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <span className="task-text done">{task.text}</span>
              <span className="text-xs text-muted">{task.projectName}</span>
            </div>
          ))}
          {completedTasks.length > 20 && (
            <p className="text-xs text-muted mt-2">...and {completedTasks.length - 20} more</p>
          )}
        </div>
      )}
    </div>
  );
}
