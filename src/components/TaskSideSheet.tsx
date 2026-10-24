import React, { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import type { Task } from "../lib/types";
import {
  updateTask,
  deleteTask,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  setTaskStatus,
  addTaskComment,
  deleteTaskComment,
} from "../lib/project";
import { getProjectData } from "../lib/storage";
import { getCrm, initials } from "../lib/crm";
import { t } from "../lib/i18n";

interface TaskSideSheetProps {
  projectKey: string;
  phaseIdx: number;
  taskIdx: number;
  task: Task;
  onClose: () => void;
}

const STATUSES: { id: "todo" | "doing" | "done"; key: string }[] = [
  { id: "todo", key: "status.todo" },
  { id: "doing", key: "status.doing" },
  { id: "done", key: "status.done" },
];

export default function TaskSideSheet({ projectKey, phaseIdx, taskIdx, task, onClose }: TaskSideSheetProps) {
  const { refresh, showToast, askConfirm, config } = useApp();
  const [newSubtask, setNewSubtask] = useState("");
  const [newComment, setNewComment] = useState("");
  const [tags, setTags] = useState((task.tags || []).join(", "));
  const [notes, setNotes] = useState(task.notes || "");

  // Always render the freshest copy: the parent passes a snapshot, and every
  // edit here writes through the project store, so a stale snapshot would hide
  // the change we just made (comments, status, assignee…).
  const freshTask = getProjectData(projectKey)?.phases?.[phaseIdx]?.tasks?.[taskIdx];
  const live: Task = freshTask ? { ...task, ...freshTask } : task;

  const people = useMemo(() => getCrm().people, []);
  const status = live.status || (live.done ? "done" : "todo");

  const depCandidates = useMemo(() => {
    const data = getProjectData(projectKey);
    const list: { id: string; text: string; done: boolean; phase: string }[] = [];
    (data?.phases || []).forEach((phase) => {
      phase.tasks.forEach((candidate) => {
        if (!candidate.id || candidate.id === live.id) return;
        list.push({ id: candidate.id, text: candidate.text, done: candidate.done, phase: phase.name });
      });
    });
    return list;
  }, [projectKey, live.id]);

  const blockedBy = useMemo(() => {
    const ids = live.dependsOn || [];
    return depCandidates.filter((d) => ids.includes(d.id) && !d.done);
  }, [depCandidates, live.dependsOn]);

  const patch = (updates: Partial<Task>) => {
    updateTask(projectKey, phaseIdx, taskIdx, updates);
    refresh();
  };

  const handleStatusChange = (next: "todo" | "doing" | "done") => {
    setTaskStatus(projectKey, phaseIdx, taskIdx, next);
    refresh();
  };

  const toggleDependency = (id: string) => {
    const current = new Set(live.dependsOn || []);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    patch({ dependsOn: [...current] });
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

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addTaskComment(projectKey, phaseIdx, taskIdx, newComment, config.author || "Me");
    setNewComment("");
    refresh();
  };

  const handleDelete = () => {
    askConfirm(t("task.deleteConfirm"), () => {
      deleteTask(projectKey, phaseIdx, taskIdx);
      refresh();
      showToast(t("common.delete"), "info");
      onClose();
    });
  };

  const isOverdue = !!live.dueDate && new Date(live.dueDate) < new Date() && !live.done;

  return (
    <>
      <div className="side-sheet-overlay" onClick={onClose} />
      <div className="side-sheet animate-slide-in-right">
        <div className="ss-header">
          <div className="ss-title">{t("task.details")}</div>
          <button className="ss-close" onClick={onClose}>✕</button>
        </div>

        <div className="ss-body">
          <div className="ss-task-text">{live.text}</div>

          {blockedBy.length > 0 && (
            <div className="blocked-banner">
              🔒 {t("task.blockedBy")}: {blockedBy.map((b) => b.text).join(", ")}
            </div>
          )}

          {/* Status */}
          <div className="ss-section">
            <label className="ss-label">{t("task.status")}</label>
            <div className="segmented">
              {STATUSES.map((s) => (
                <button
                  key={s.id}
                  className={`segment ${status === s.id ? "on" : ""}`}
                  onClick={() => handleStatusChange(s.id)}
                >
                  {t(s.key)}
                </button>
              ))}
            </div>
          </div>

          {/* Assignee */}
          <div className="ss-section">
            <label className="ss-label">{t("task.assignee")}</label>
            <select
              className="ss-select"
              value={live.assigneeId || ""}
              onChange={(e) => patch({ assigneeId: e.target.value || undefined })}
            >
              <option value="">{t("task.unassigned")}</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {live.assigneeId && (
              <div className="assignee-preview">
                <span className="avatar avatar-sm">
                  {initials(people.find((p) => p.id === live.assigneeId)?.name || "?")}
                </span>
                <span>{people.find((p) => p.id === live.assigneeId)?.name}</span>
              </div>
            )}
          </div>

          {/* Priority + Due */}
          <div className="ss-grid-2">
            <div className="ss-section">
              <label className="ss-label">{t("task.priority")}</label>
              <select
                className="ss-select"
                value={live.priority || ""}
                onChange={(e) => patch({ priority: (e.target.value || undefined) as Task["priority"] })}
              >
                <option value="">—</option>
                <option value="high">🔴 {t("priority.high")}</option>
                <option value="med">🟡 {t("priority.med")}</option>
                <option value="low">🟢 {t("priority.low")}</option>
              </select>
            </div>
            <div className="ss-section">
              <label className="ss-label">{t("task.dueDate")}</label>
              <input
                className={`ss-input ${isOverdue ? "overdue" : ""}`}
                type="date"
                value={live.dueDate || ""}
                onChange={(e) => patch({ dueDate: e.target.value || undefined })}
              />
            </div>
          </div>

          {/* Tags */}
          <div className="ss-section">
            <label className="ss-label">{t("task.tags")}</label>
            <input
              className="ss-input"
              value={tags}
              placeholder="design, urgent"
              onChange={(e) => setTags(e.target.value)}
              onBlur={() => patch({ tags: tags.split(",").map((x) => x.trim()).filter(Boolean) })}
            />
          </div>

          {/* Notes */}
          <div className="ss-section">
            <label className="ss-label">{t("task.notes")}</label>
            <textarea
              className="ss-input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => patch({ notes: notes || undefined })}
            />
          </div>

          {/* Dependencies */}
          <div className="ss-section">
            <label className="ss-label">{t("task.dependsOn")}</label>
            {depCandidates.length === 0 ? (
              <div className="ss-muted">{t("task.noDeps")}</div>
            ) : (
              <div className="dep-list">
                {depCandidates.map((dep) => (
                  <label key={dep.id} className="dep-item">
                    <input
                      type="checkbox"
                      checked={(live.dependsOn || []).includes(dep.id)}
                      onChange={() => toggleDependency(dep.id)}
                    />
                    <span className={dep.done ? "dep-done" : ""}>{dep.text}</span>
                    <span className="dep-phase">{dep.phase}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Sub-tasks */}
          <div className="ss-section">
            <label className="ss-label">{t("task.subtasks")} ({live.subtasks?.length || 0})</label>
            <div className="ss-subtasks">
              {live.subtasks?.map((sub, idx) => (
                <div key={idx} className="ss-subtask">
                  <div
                    className={`ss-subtask-check ${sub.done ? "done" : ""}`}
                    onClick={() => { toggleSubtask(projectKey, phaseIdx, taskIdx, idx); refresh(); }}
                  >
                    {sub.done && "✓"}
                  </div>
                  <span className={`ss-subtask-text ${sub.done ? "done" : ""}`}>{sub.text}</span>
                  <button className="ss-subtask-delete" onClick={() => { deleteSubtask(projectKey, phaseIdx, taskIdx, idx); refresh(); }}>✕</button>
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

          {/* Comments */}
          <div className="ss-section">
            <label className="ss-label">{t("task.comments")} ({live.comments?.length || 0})</label>
            <div className="comment-list">
              {(live.comments || []).map((comment) => (
                <div key={comment.id} className="comment-item">
                  <span className="avatar avatar-xs">{initials(comment.by || "Me")}</span>
                  <div className="comment-body">
                    <div className="comment-meta">
                      <strong>{comment.by || "Me"}</strong>
                      <span>{new Date(comment.at).toLocaleString()}</span>
                    </div>
                    <div className="comment-text">{comment.text}</div>
                  </div>
                  <button
                    className="btn-icon"
                    title={t("common.delete")}
                    onClick={() => { deleteTaskComment(projectKey, phaseIdx, taskIdx, comment.id); refresh(); }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="comment-input">
              <input
                className="input"
                value={newComment}
                placeholder={t("task.addComment")}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              />
              <button className="btn btn-primary btn-sm" onClick={handleAddComment}>{t("task.post")}</button>
            </div>
          </div>

          <div className="ss-actions">
            <button className="btn btn-secondary" onClick={onClose}>{t("common.close")}</button>
            <button className="btn btn-danger" onClick={handleDelete}>{t("common.delete")}</button>
          </div>
        </div>
      </div>
    </>
  );
}
