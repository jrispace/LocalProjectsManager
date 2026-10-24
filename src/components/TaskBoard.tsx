import React, { useMemo, useState } from "react";
import type { ProjectData, Task } from "../lib/types";
import { setTaskStatus, toggleTask } from "../lib/project";
import { getCrm, initials } from "../lib/crm";
import { formatDue, isOverdue } from "../lib/utils";
import { t } from "../lib/i18n";
import { useApp } from "../context/AppContext";
import TaskSideSheet from "./TaskSideSheet";

interface Props {
  projectKey: string;
  data: ProjectData;
  refreshKey: number;
}

const COLUMNS: { id: "todo" | "doing" | "done"; key: string; accent: string }[] = [
  { id: "todo", key: "status.todo", accent: "#64748b" },
  { id: "doing", key: "status.doing", accent: "#38bdf8" },
  { id: "done", key: "status.done", accent: "#10b981" },
];

export default function TaskBoard({ projectKey, data, refreshKey }: Props) {
  const { refresh } = useApp();
  const [drag, setDrag] = useState<{ phaseIdx: number; taskIdx: number } | null>(null);
  const [open, setOpen] = useState<{ phaseIdx: number; taskIdx: number; task: Task } | null>(null);

  const people = useMemo(() => getCrm().people, [refreshKey]);

  const cards = useMemo(() => {
    const out: { phaseIdx: number; taskIdx: number; phase: string; task: Task }[] = [];
    data.phases.forEach((phase, phaseIdx) => {
      phase.tasks.forEach((task, taskIdx) => {
        out.push({ phaseIdx, taskIdx, phase: phase.name, task });
      });
    });
    return out;
  }, [data, refreshKey]);

  const column = (status: "todo" | "doing" | "done") =>
    cards.filter((c) => (c.task.status || (c.task.done ? "done" : "todo")) === status);

  const drop = (status: "todo" | "doing" | "done") => {
    if (!drag) return;
    setTaskStatus(projectKey, drag.phaseIdx, drag.taskIdx, status);
    setDrag(null);
    refresh();
  };

  return (
    <>
      <div className="board board-tasks">
        {COLUMNS.map((col) => {
          const list = column(col.id);
          return (
            <div
              key={col.id}
              className={`board-col ${drag ? "droppable" : ""}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => drop(col.id)}
            >
              <div className="board-col-head">
                <span className="board-dot" style={{ background: col.accent }} />
                <span className="board-col-title">{t(col.key)}</span>
                <span className="board-count">{list.length}</span>
              </div>
              <div className="board-col-body">
                {list.length === 0 && <div className="board-empty">{t("board.empty")}</div>}
                {list.map(({ phaseIdx, taskIdx, phase, task }) => {
                  const assignee = task.assigneeId ? people.find((p) => p.id === task.assigneeId) : undefined;
                  const overdue = !!task.dueDate && isOverdue(task.dueDate) && !task.done;
                  return (
                    <div
                      key={`${phaseIdx}-${taskIdx}-${task.id || task.text}`}
                      className={`task-card ${task.done ? "is-done" : ""}`}
                      draggable
                      onDragStart={() => setDrag({ phaseIdx, taskIdx })}
                      onDragEnd={() => setDrag(null)}
                      onClick={() => setOpen({ phaseIdx, taskIdx, task })}
                    >
                      <div className="task-card-top">
                        <div
                          className={`task-checkbox sm ${task.done ? "checked" : ""}`}
                          onClick={(e) => { e.stopPropagation(); toggleTask(projectKey, phaseIdx, taskIdx); refresh(); }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <span className="task-card-title">{task.text}</span>
                      </div>

                      <div className="task-card-meta">
                        <span className="chip chip-soft">{phase}</span>
                        {task.priority === "high" && <span className="chip chip-danger">high</span>}
                        {task.dueDate && <span className={`chip ${overdue ? "chip-danger" : "chip-soft"}`}>{formatDue(task.dueDate)}</span>}
                        {(task.dependsOn || []).length > 0 && <span className="chip chip-warn">🔒</span>}
                        {task.comments && task.comments.length > 0 && <span className="chip chip-soft">💬 {task.comments.length}</span>}
                      </div>

                      <div className="task-card-foot">
                        {assignee ? (
                          <span className="avatar avatar-sm" title={assignee.name}>{initials(assignee.name)}</span>
                        ) : <span />}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <span className="cell-sub">
                            {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {open && (
        <TaskSideSheet
          projectKey={projectKey}
          phaseIdx={open.phaseIdx}
          taskIdx={open.taskIdx}
          task={open.task}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}
