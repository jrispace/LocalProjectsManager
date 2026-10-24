import React, { useState } from "react";
import type { Task } from "../lib/types";
import { useApp } from "../context/AppContext";
import { toggleTask, deleteTask, toggleSubtask } from "../lib/project";
import { formatDue, isOverdue, priorityLabel } from "../lib/utils";
import { haptic } from "../lib/haptic";
import TaskSideSheet from "./TaskSideSheet";
import { addActivity } from "../lib/storage";
import { getCrm, initials } from "../lib/crm";
import { t } from "../lib/i18n";

interface TaskCardProps {
  task: Task;
  phaseIdx: number;
  taskIdx: number;
  projectKey: string;
  phaseNames: string[];
}

export default function TaskCard({ task, phaseIdx, taskIdx, projectKey, phaseNames }: TaskCardProps) {
  const { refresh, showToast, askConfirm } = useApp();
  const [sheetOpen, setSheetOpen] = useState(false);
  const people = getCrm().people;
  const assignee = task.assigneeId ? people.find((p) => p.id === task.assigneeId) : undefined;
  const blocked = (task.dependsOn || []).length > 0 && task.status !== "done";

  const handleToggle = () => {
    haptic();
    toggleTask(projectKey, phaseIdx, taskIdx);
    refresh();
    if (!task.done) {
      addActivity({
        type: "completed",
        text: `Completed task: ${task.text}`,
        project: projectKey,
        time: new Date().toISOString(),
      });
    }
  };

  const handleDelete = () => {
    askConfirm(`Delete task "${task.text}"?`, () => {
      deleteTask(projectKey, phaseIdx, taskIdx);
      refresh();
      showToast("Task deleted", "info");
    });
  };

  const subDone = task.subtasks?.filter((s) => s.done).length || 0;
  const subTotal = task.subtasks?.length || 0;

  return (
    <>
      <div className="task-item">
        <div
          className={`task-checkbox ${task.done ? "checked" : ""}`}
          onClick={handleToggle}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <span className={`task-text ${task.done ? "done" : ""}`} onClick={() => setSheetOpen(true)}>
          {task.text}
        </span>

        {task.priority && (
          <span className={`priority-badge ${task.priority}`}>{priorityLabel(task.priority)}</span>
        )}

        {task.dueDate && (
          <span className={`due-badge ${isOverdue(task.dueDate) && !task.done ? "overdue" : ""}`}>
            {formatDue(task.dueDate)}
          </span>
        )}

        {task.notes && (
          <span className="task-notes-preview" title={task.notes}>
            {task.notes.slice(0, 40)}{task.notes.length > 40 ? "..." : ""}
          </span>
        )}

        {task.status === "doing" && <span className="chip chip-accent">{t("status.doing")}</span>}
        {blocked && <span className="chip chip-warn" title={t("task.dependsOn")}>🔒</span>}
        {assignee && <span className="avatar avatar-sm" title={assignee.name}>{initials(assignee.name)}</span>}

        {subTotal > 0 && (
          <span className="subtask-badge">{subDone}/{subTotal}</span>
        )}

        <button className="task-delete btn-icon" onClick={handleDelete}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>

      {/* Inline subtasks */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div style={{ paddingLeft: 40 }}>
          {task.subtasks.map((sub, si) => (
            <div key={si} className="subtask-item">
              <div
                className={`task-checkbox ${sub.done ? "checked" : ""}`}
                onClick={() => { toggleSubtask(projectKey, phaseIdx, taskIdx, si); refresh(); }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <span className={`task-text ${sub.done ? "done" : ""}`}>{sub.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Task Side Sheet */}
      {sheetOpen && (
        <TaskSideSheet
          projectKey={projectKey}
          phaseIdx={phaseIdx}
          taskIdx={taskIdx}
          task={task}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </>
  );
}
