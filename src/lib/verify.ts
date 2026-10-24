import type { ProjectData, Phase, Task } from "./types";

// Verify/Profile Sync — ensures project has required structure
export function verifyProject(data: ProjectData): {
  fixed: boolean;
  addedTasks: string[];
  addedPhases: string[];
} {
  let fixed = false;
  const addedTasks: string[] = [];
  const addedPhases: string[] = [];

  // Ensure phases array exists
  if (!data.phases) {
    data.phases = [];
    fixed = true;
  }

  // Ensure at least one phase
  if (data.phases.length === 0) {
    data.phases.push({
      name: "General",
      desc: "",
      tasks: [],
      _open: true,
    });
    addedPhases.push("General");
    fixed = true;
  }

  // Ensure each phase has required fields
  for (const phase of data.phases) {
    if (!phase.tasks) {
      phase.tasks = [];
      fixed = true;
    }
    if (!phase.desc) {
      phase.desc = "";
      fixed = true;
    }

    // Ensure each task has required fields
    for (const task of phase.tasks) {
      if (!task.createdAt) {
        task.createdAt = new Date().toISOString();
        fixed = true;
      }
      if (!task.subtasks) {
        task.subtasks = [];
        fixed = true;
      }
    }
  }

  return { fixed, addedTasks, addedPhases };
}

// Sync profile — merge templates into existing project
export function syncProfile(
  data: ProjectData,
  template: { phases: { name: string; tasks: string[] }[] },
): { synced: boolean; added: string[] } {
  const added: string[] = [];

  for (const tpl of template.phases) {
    let phase = data.phases.find((p) => p.name === tpl.name);
    if (!phase) {
      phase = {
        name: tpl.name,
        desc: "",
        tasks: [],
        _open: true,
      };
      data.phases.push(phase);
      added.push(`Phase: ${tpl.name}`);
    }

    for (const taskText of tpl.tasks) {
      if (!phase.tasks.some((t) => t.text === taskText)) {
        phase.tasks.push({
          text: taskText,
          notes: "",
          done: false,
          subtasks: [],
          createdBy: "System",
          createdAt: new Date().toISOString(),
        });
        added.push(`Task: ${taskText}`);
      }
    }
  }

  return { synced: added.length > 0, added };
}
