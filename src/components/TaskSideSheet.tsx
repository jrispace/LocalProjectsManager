import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import type { Task } from "../lib/types";
import { updateTask, deleteTask, addSubtask, toggleSubtask, deleteSubtask } from "../lib/project";
import { t } from "../lib/i18n";

interface TaskSideSheetProps {
  projectKey: string;
  phaseIdx: number;
  taskIdx: number;
  task: Task;
  onClose: () => void;
}

export default function TaskSideSheet({ projectKey, phaseIdx, taskIdx, task, onClose }: TaskSideSheetProps) {
  const { refresh, showToast, askConfirm, pushUndo, config } = useApp();
  const [newSubtask, setNewSubtask] = useState("");

  const handleStatusChange = (status: string) => {
    updateTask(projectKey, phaseIdx, taskIdx, { status });
    refresh();
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    addSubtask(projectKey, phaseIdx, taskIdx, {
      text: newSubtask.trim(),
      done: false,
      createdBy: config.author || "User",
      createdAt: new Date().toISOString(),
    });
    setNewSubtask("");
    refresh();
  };

  const handleToggleSubtask = (subIdx: number) => {
    toggleSubtask(projectKey, phaseIdx, taskIdx, subIdx);
    refresh();
  };

  const handleDeleteSubtask = (subIdx: number) => {
    deleteSubtask(projectKey, phaseIdx, taskIdx, subIdx);
    refresh();
    showToast(t("common.undo"), "info");
  };

  const handleDelete = () => {
    askConfirm(t("task.deleteConfirm"), () => {
      pushUndo({
        label: "Delete task",
        fn: () => {
          // Restore task would go here
          refresh();
        },
      });
      deleteTask(projectKey, phaseIdx, taskIdx);
      refresh();
      showToast(t("common.undo"), "info", () => {
        // Undo handler
      });
      onClose();
    });
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.done;
  const statuses = ["open", "inProgress", "done", "blocked"];
  const priorityLabels: Record<string, string> = {
    high: "🔴 High",
    med: "🟡 Medium",
    low: "🟢 Low",
  };

  return (
    <>
      <div className="side-sheet-overlay" onClick={onClose} />
      <div className="side-sheet animate-slide-in-right">
        {/* Header */}
        <div className="ss-header">
          <div className="ss-title">{t("task.edit")}</div>
          <button className="ss-close" onClick={onClose}>✕</button>
        </div>

        {/* Task info */}
        <div className="ss-body">
          <div className="ss-task-text">{task.text}</div>

          {/* Status */}
          <div className="ss-section">
            <label className="ss-label">{t("task.status")}</label>
            <select
              className="ss-select"
              value={task.status || "open"}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>{t(`status.${s}`)}</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          {task.priority && (
            <div className="ss-section">
              <label className="ss-label">{t("task.priority")}</label>
              <span className="ss-priority">{priorityLabels[task.priority] || task.priority}</span>
            </div>
          )}

          {/* Due date */}
          {task.dueDate && (
            <div className="ss-section">
              <label className="ss-label">{t("task.dueDate")}</label>
              <span className={`ss-due ${isOverdue ? "overdue" : ""}`}>
                {task.dueDate} {isOverdue && "⚠️"}
              </span>
            </div>
          )}

          {/* Notes */}
          {task.notes && (
            <div className="ss-section">
              <label className="ss-label">{t("task.notes")}</label>
              <div className="ss-notes">{task.notes}</div>
            </div>
          )}

          {/* Metadata */}
          <div className="ss-section ss-meta">
            {task.createdAt && (
              <div className="ss-meta-item">
                <span className="ss-meta-label">Created:</span>
                <span>{new Date(task.createdAt).toLocaleDateString()}</span>
              </div>
            )}
            {task.createdBy && (
              <div className="ss-meta-item">
                <span className="ss-meta-label">By:</span>
                <span>{task.createdBy}</span>
              </div>
            )}
          </div>

          {/* Sub-tasks */}
          <div className="ss-section">
            <label className="ss-label">{t("task.subtasks")} ({task.subtasks?.length || 0})</label>
            <div className="ss-subtasks">
              {task.subtasks?.map((sub, idx) => (
                <div key={idx} className="ss-subtask">
                  <div
                    className={`ss-subtask-check ${sub.done ? "done" : ""}`}
                    onClick={() => handleToggleSubtask(idx)}
                  >
                    {sub.done && "✓"}
                  </div>
                  <span className={`ss-subtask-text ${sub.done ? "done" : ""}`}>{sub.text}</span>
                  <button className="ss-subtask-delete" onClick={() => handleDeleteSubtask(idx)}>✕</button>
                </div>
              ))}
            </div>
            <div className="ss-subtask-input">
              <input
                type="text"
                placeholder={t("task.addSubtask")}
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
              />
              <button onClick={handleAddSubtask}>+</button>
            </div>
          </div>

          {/* Actions */}
          <div className="ss-actions">
            <button className="btn btn-secondary" onClick={onClose}>{t("common.close")}</button>
            <button className="btn btn-danger" onClick={handleDelete}>{t("common.delete")}</button>
          </div>
        </div>
      </div>
    </>
  );
}
