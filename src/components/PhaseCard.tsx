import React, { useState } from "react";
import type { Phase } from "../lib/types";
import { useApp } from "../context/AppContext";
import { addTask, togglePhase, deletePhase, movePhase } from "../lib/project";
import TaskCard from "./TaskCard";

interface PhaseCardProps {
  phase: Phase;
  phaseIdx: number;
  projectKey: string;
  phaseNames: string[];
}

export default function PhaseCard({ phase, phaseIdx, projectKey, phaseNames }: PhaseCardProps) {
  const { refresh, showToast, askConfirm } = useApp();
  const [newTask, setNewTask] = useState("");
  const [collapsed, setCollapsed] = useState(!phase._open);

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    addTask(projectKey, phaseIdx, {
      text: newTask.trim(),
      done: false,
      subtasks: [],
      createdAt: new Date().toISOString(),
    });
    setNewTask("");
    refresh();
    showToast("Task added", "success");
  };

  const handleDeletePhase = () => {
    const count = phase.tasks.length;
    askConfirm(`Delete phase "${phase.name}" and its ${count} task(s)?`, () => {
      deletePhase(projectKey, phaseIdx);
      refresh();
      showToast("Phase deleted", "info");
    });
  };

  const doneCount = phase.tasks.filter((t) => t.done).length;
  const total = phase.tasks.length;

  return (
    <div className="phase-card">
      <div className="phase-header" onClick={() => { setCollapsed(!collapsed); togglePhase(projectKey, phaseIdx); }}>
        <div className="phase-name">
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
          {phase.name}
          <span className="phase-badge">{doneCount}/{total}</span>
        </div>
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button className="btn-icon" onClick={() => { movePhase(projectKey, phaseIdx, -1); refresh(); }} title="Move up">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
          </button>
          <button className="btn-icon" onClick={() => { movePhase(projectKey, phaseIdx, 1); refresh(); }} title="Move down">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <button className="btn-icon" onClick={handleDeletePhase} title="Delete phase">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>

      {phase.desc && <div className="phase-desc">{phase.desc}</div>}

      {!collapsed && (
        <>
          {phase.tasks.map((task, ti) => (
            <TaskCard
              key={`${phaseIdx}-${ti}`}
              task={task}
              phaseIdx={phaseIdx}
              taskIdx={ti}
              projectKey={projectKey}
              phaseNames={phaseNames}
            />
          ))}

          <div className="flex gap-2 mt-2">
            <input
              className="input"
              placeholder="Add a task..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            />
            <button className="btn btn-primary btn-sm" onClick={handleAddTask}>Add</button>
          </div>
        </>
      )}
    </div>
  );
}
