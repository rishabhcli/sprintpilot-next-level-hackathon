import { buildSprintBrief } from "./exporter.js";
import { STAGES, generateSprintPlan } from "./planner.js";

function finalizeState(state) {
  return {
    ...state,
    briefPreview: buildSprintBrief(state)
  };
}

export function createWorkspace({
  workspaceName = "SprintPilot Workspace",
  objective = "Turn messy notes into a focused sprint",
  sourceInput = "",
  baseDate = new Date(),
  mutateTasks
} = {}) {
  const plan = generateSprintPlan(sourceInput, { objective, baseDate });
  const tasks = typeof mutateTasks === "function" ? mutateTasks(plan.tasks) : plan.tasks;

  return finalizeState({
    workspaceName,
    objective,
    sourceInput,
    tasks,
    week: plan.week,
    weekLabel: plan.weekLabel,
    generatedAt: plan.generatedAt,
    summary: plan.summary
  });
}

export function regenerateWorkspace(state, baseDate = new Date()) {
  return createWorkspace({
    workspaceName: state.workspaceName,
    objective: state.objective,
    sourceInput: state.sourceInput,
    baseDate
  });
}

export function updateWorkspaceField(state, field, value) {
  return finalizeState({
    ...state,
    [field]: value
  });
}

export function moveTaskToStage(state, taskId, stage) {
  if (!STAGES.includes(stage)) {
    return state;
  }

  const tasks = state.tasks.map((task) => (task.id === taskId ? { ...task, stage } : task));
  return finalizeState({ ...state, tasks });
}

export function getMetrics(tasks) {
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((task) => task.stage === "Done").length;
  const activeTasks = tasks.filter((task) => task.stage === "In Progress").length;
  const averagePriority =
    totalTasks === 0
      ? 0
      : Math.round(tasks.reduce((total, task) => total + task.priority, 0) / totalTasks);

  return {
    totalTasks,
    doneTasks,
    activeTasks,
    averagePriority,
    nowCount: tasks.filter((task) => task.priorityBand === "Now").length
  };
}

export function hydrateWorkspace(candidate) {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const requiredFields = ["workspaceName", "objective", "sourceInput", "tasks", "week", "weekLabel", "generatedAt", "summary"];
  if (!requiredFields.every((field) => field in candidate)) {
    return null;
  }

  if (!Array.isArray(candidate.tasks) || !Array.isArray(candidate.week)) {
    return null;
  }

  const stagesAreValid = candidate.tasks.every((task) => STAGES.includes(task.stage));
  if (!stagesAreValid) {
    return null;
  }

  return finalizeState(candidate);
}
