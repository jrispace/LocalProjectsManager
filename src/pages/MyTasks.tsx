import React, { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { t } from "../lib/i18n";
import { getRegistry, getProjectData } from "../lib/storage";
import { getCrm } from "../lib/crm";
import type { Task } from "../lib/types";
import TaskSideSheet from "../components/TaskSideSheet";

const ME_KEY = "lpm.myPersonId.v1";

interface Row {
  projectKey: string;
  projectName: string;
  phaseIdx: number;
  taskIdx: number;
  phaseName: string;
  task: Task;
}

function dayDiff(dateStr?: string): number | null {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

export default function MyTasks() {
  const { refreshKey, refresh, selectProject } = useApp();
  const [meId, setMeId] = useState<string>("");
  const [open, setOpen] = useState<Row | null>(null);

  const crm = useMemo(() => getCrm(), [refreshKey]);
  const people = crm.people;

  useEffect(() => {
    const saved = localStorage.getItem(ME_KEY);
    if (saved && people.some((p) => p.id === saved)) {
      setMeId(saved);
    } else if (!meId && people.length > 0) {
      setMeId(people[0].id);
    }
  }, [people, meId]);

  const chooseMe = (id: string) => {
    setMeId(id);
    localStorage.setItem(ME_KEY, id);
  };

  const rows = useMemo(() => {
    const out: Row[] = [];
    if (!meId) return out;
    for (const project of getRegistry().projects || []) {
      const data = getProjectData(project.key);
      if (!data) continue;
      data.phases.forEach((phase, phaseIdx) => {
        phase.tasks.forEach((task, taskIdx) => {
          if (task.assigneeId !== meId) return;
          out.push({
            projectKey: project.key,
            projectName: data.project || project.name,
            phaseIdx,
            taskIdx,
            phaseName: phase.name,
            task,
          });
        });
      });
    }
    return out;
  }, [meId, refreshKey]);

  const open_ = rows.filter((r) => r.task.status !== "done" && !r.task.done);
  const done = rows.filter((r) => r.task.status === "done" || r.task.done);

  const groups = [
    { key: "mytasks.overdue", items: open_.filter((r) => (dayDiff(r.task.dueDate) ?? 99) < 0) },
    { key: "mytasks.today", items: open_.filter((r) => dayDiff(r.task.dueDate) === 0) },
    { key: "mytasks.week", items: open_.filter((r) => { const d = dayDiff(r.task.dueDate); return d !== null && d > 0 && d <= 7; }) },
    { key: "mytasks.later", items: open_.filter((r) => (dayDiff(r.task.dueDate) ?? -1) > 7) },
    { key: "mytasks.noDate", items: open_.filter((r) => !r.task.dueDate) },
  ];

  const renderRow = (row: Row) => {
    const due = dayDiff(row.task.dueDate);
    const overdue = due !== null && due < 0;
    return (
      <div key={`${row.projectKey}-${row.phaseIdx}-${row.taskIdx}`} className="task-item mytask-row" onClick={() => setOpen(row)}>
        <div className={`task-checkbox ${row.task.done ? "checked" : ""}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <span className={`task-text ${row.task.done ? "done" : ""}`}>{row.task.text}</span>
        {row.task.priority === "high" && <span className="chip chip-danger">high</span>}
        {row.task.status === "doing" && <span className="chip chip-accent">{t("status.doing")}</span>}
        {(row.task.comments || []).length > 0 && <span className="chip chip-soft">💬 {(row.task.comments || []).length}</span>}
        {row.task.dueDate && <span className={`chip ${overdue ? "chip-danger" : "chip-soft"}`}>{row.task.dueDate}</span>}
        <button
          className="chip chip-soft project-chip"
          onClick={(e) => { e.stopPropagation(); selectProject(row.projectKey); }}
          title={t("mytasks.openProject")}
        >
          {row.projectName} › {row.phaseName}
        </button>
      </div>
    );
  };

  return (
    <div className="page active animate-fade-in">
      <div className="page-head">
        <div>
          <h2 className="page-title">{t("mytasks.title")}</h2>
          <p className="page-sub">{open_.length} {t("mytasks.open")} · {done.length} {t("mytasks.finished")}</p>
        </div>
        <div className="page-actions">
          <select className="input" value={meId} onChange={(e) => chooseMe(e.target.value)} aria-label={t("mytasks.whoAmI")}>
            {people.length === 0 && <option value="">{t("mytasks.noPeople")}</option>}
            {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {people.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <div className="empty-state-title">{t("mytasks.noPeople")}</div>
          <div className="empty-state-desc">{t("mytasks.addPeopleHint")}</div>
          <button className="btn btn-primary" onClick={() => selectProject(null)}>{t("projects.goTo")}</button>
        </div>
      ) : rows.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <div className="empty-state-title">{t("mytasks.empty")}</div>
          <div className="empty-state-desc">{t("mytasks.emptyHint")}</div>
        </div>
      ) : (
        <>
          {groups.map((group) =>
            group.items.length === 0 ? null : (
              <div className="card mb-4" key={group.key}>
                <div className="card-header">
                  <span className="card-title">{t(group.key)} ({group.items.length})</span>
                </div>
                {group.items.map(renderRow)}
              </div>
            )
          )}
          {done.length > 0 && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">{t("mytasks.finished")} ({done.length})</span>
              </div>
              {done.slice(0, 10).map(renderRow)}
            </div>
          )}
        </>
      )}

      {open && (
        <TaskSideSheet
          projectKey={open.projectKey}
          phaseIdx={open.phaseIdx}
          taskIdx={open.taskIdx}
          task={open.task}
          onClose={() => { setOpen(null); refresh(); }}
        />
      )}
    </div>
  );
}
