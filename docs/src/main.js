import { copyText, downloadBrief } from "./exporter.js";
import { createSeedWorkspace } from "./demo.js";
import { STAGES, groupTasksByDay, groupTasksByStage } from "./planner.js";
import {
  createWorkspace,
  getMetrics,
  hydrateWorkspace,
  moveTaskToStage,
  updateWorkspaceField
} from "./state.js";
import { clearWorkspaceSnapshot, loadWorkspaceSnapshot, saveWorkspaceSnapshot } from "./storage.js";

const elements = {
  workspaceName: document.querySelector("#workspaceName"),
  objectiveInput: document.querySelector("#objectiveInput"),
  sourceInput: document.querySelector("#sourceInput"),
  generateButton: document.querySelector("#generateButton"),
  demoButton: document.querySelector("#demoButton"),
  resetButton: document.querySelector("#resetButton"),
  statusLine: document.querySelector("#statusLine"),
  statsGrid: document.querySelector("#statsGrid"),
  insightCards: document.querySelector("#insightCards"),
  boardColumns: document.querySelector("#boardColumns"),
  roadmapGrid: document.querySelector("#roadmapGrid"),
  briefPreview: document.querySelector("#briefPreview"),
  copyBriefButton: document.querySelector("#copyBriefButton"),
  downloadBriefButton: document.querySelector("#downloadBriefButton"),
  toast: document.querySelector("#toast")
};

let state = hydrateWorkspace(loadWorkspaceSnapshot()) ?? createSeedWorkspace(new Date());
let draggedTaskId = null;
let toastTimer = null;

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove("visible");
  }, 2200);
}

function persist() {
  saveWorkspaceSnapshot(state);
}

function renderStats() {
  const metrics = getMetrics(state.tasks);
  const cards = [
    { label: "Tasks mapped", value: metrics.totalTasks, detail: `${metrics.nowCount} marked as now` },
    { label: "Average priority", value: metrics.averagePriority, detail: "Blend of urgency and impact" },
    { label: "In motion", value: metrics.activeTasks, detail: "Tasks already underway" },
    { label: "Completed", value: metrics.doneTasks, detail: "Done items stay in the brief" }
  ];

  elements.statsGrid.innerHTML = cards
    .map(
      (card) => `
        <article class="stat-card">
          <p>${escapeHtml(card.label)}</p>
          <strong>${escapeHtml(String(card.value))}</strong>
          <span>${escapeHtml(card.detail)}</span>
        </article>
      `
    )
    .join("");
}

function renderInsights() {
  const cards = [
    {
      label: "Focus lane",
      value: state.summary.focus,
      accent: "focus"
    },
    {
      label: "Quick wins",
      value: state.summary.quickWins.join(" and "),
      accent: "quick"
    },
    {
      label: "Risk watch",
      value: state.summary.risk,
      accent: "risk"
    },
    {
      label: "Operating rhythm",
      value: state.summary.rhythm,
      accent: "tempo"
    }
  ];

  elements.insightCards.innerHTML = cards
    .map(
      (card) => `
        <article class="insight-card insight-${card.accent}">
          <p>${escapeHtml(card.label)}</p>
          <strong>${escapeHtml(card.value)}</strong>
        </article>
      `
    )
    .join("");
}

function renderBoard() {
  const stageGroups = groupTasksByStage(state.tasks);

  elements.boardColumns.innerHTML = stageGroups
    .map(
      ({ stage, tasks }) => `
        <section class="board-column" data-stage="${escapeHtml(stage)}">
          <header class="board-column-header">
            <div>
              <h3>${escapeHtml(stage)}</h3>
              <p>${escapeHtml(stageCopy(stage))}</p>
            </div>
            <span class="column-count">${tasks.length}</span>
          </header>

          <div class="column-dropzone" data-stage="${escapeHtml(stage)}">
            ${
              tasks.length > 0
                ? tasks
                    .map(
                      (task) => `
                        <article class="task-card" draggable="true" data-task-id="${escapeHtml(task.id)}">
                          <div class="task-card-top">
                            <div class="task-chip-row">
                              <span class="task-chip task-chip-category">${escapeHtml(task.category)}</span>
                              <span class="task-chip task-chip-band">${escapeHtml(task.priorityBand)}</span>
                            </div>
                            <label class="stage-picker">
                              <span class="sr-only">Move task</span>
                              <select data-task-stage="${escapeHtml(task.id)}" aria-label="Move ${escapeHtml(task.title)}">
                                ${STAGES.map(
                                  (stageOption) => `
                                    <option value="${escapeHtml(stageOption)}" ${
                                      stageOption === task.stage ? "selected" : ""
                                    }>
                                      ${escapeHtml(stageOption)}
                                    </option>
                                  `
                                ).join("")}
                              </select>
                            </label>
                          </div>

                          <h4>${escapeHtml(task.title)}</h4>
                          <p>${escapeHtml(task.description)}</p>

                          <div class="score-grid">
                            ${scorePill("Urgency", task.urgency)}
                            ${scorePill("Impact", task.impact)}
                            ${scorePill("Effort", task.effort)}
                          </div>

                          <div class="task-meta">
                            <span>${escapeHtml(task.timebox)}</span>
                            <span>${escapeHtml(task.dueLabel)}</span>
                          </div>
                        </article>
                      `
                    )
                    .join("")
                : '<p class="column-empty">Drop a task here or keep this lane clear.</p>'
            }
          </div>
        </section>
      `
    )
    .join("");
}

function renderRoadmap() {
  const days = groupTasksByDay(state.tasks, state.week);

  elements.roadmapGrid.innerHTML = days
    .map(
      (day) => `
        <article class="roadmap-day">
          <header>
            <p>${escapeHtml(day.label)}</p>
            <strong>${escapeHtml(day.dateLabel)}</strong>
          </header>
          <ul>
            ${
              day.tasks.length > 0
                ? day.tasks
                    .map(
                      (task) => `
                        <li>
                          <span>${escapeHtml(task.title)}</span>
                          <small>${escapeHtml(task.timebox)}</small>
                        </li>
                      `
                    )
                    .join("")
                : "<li class=\"roadmap-empty\">Use this slot for buffer, QA, or follow-ups.</li>"
            }
          </ul>
        </article>
      `
    )
    .join("");
}

function renderStatus() {
  const generated = new Date(state.generatedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  });
  elements.statusLine.textContent = `Last planned ${generated}. Input edits save instantly; click Generate sprint plan to refresh the board.`;
}

function render() {
  elements.workspaceName.value = state.workspaceName;
  elements.objectiveInput.value = state.objective;
  elements.sourceInput.value = state.sourceInput;
  elements.briefPreview.value = state.briefPreview;
  renderStats();
  renderInsights();
  renderBoard();
  renderRoadmap();
  renderStatus();
}

function scorePill(label, value) {
  return `<span class="score-pill"><strong>${escapeHtml(label)}</strong> ${escapeHtml(String(value))}</span>`;
}

function stageCopy(stage) {
  if (stage === "Backlog") {
    return "Good ideas parked until they earn the week.";
  }

  if (stage === "Ready") {
    return "Clear enough to start without a planning meeting.";
  }

  if (stage === "In Progress") {
    return "Active work the team should keep visible.";
  }

  return "Shipped or wrapped during the sprint.";
}

function rebuildWorkspace() {
  state = createWorkspace({
    workspaceName: state.workspaceName,
    objective: state.objective,
    sourceInput: state.sourceInput,
    baseDate: new Date()
  });
  persist();
  render();
  showToast("Sprint plan regenerated");
}

elements.generateButton.addEventListener("click", () => {
  rebuildWorkspace();
});

elements.demoButton.addEventListener("click", () => {
  state = createSeedWorkspace(new Date());
  persist();
  render();
  showToast("Demo workspace loaded");
});

elements.resetButton.addEventListener("click", () => {
  if (!window.confirm("Reset the workspace back to the demo data?")) {
    return;
  }

  clearWorkspaceSnapshot();
  state = createSeedWorkspace(new Date());
  persist();
  render();
  showToast("Workspace reset");
});

elements.workspaceName.addEventListener("input", (event) => {
  state = updateWorkspaceField(state, "workspaceName", event.target.value);
  persist();
  elements.briefPreview.value = state.briefPreview;
});

elements.objectiveInput.addEventListener("input", (event) => {
  state = updateWorkspaceField(state, "objective", event.target.value);
  persist();
  elements.briefPreview.value = state.briefPreview;
});

elements.sourceInput.addEventListener("input", (event) => {
  state = updateWorkspaceField(state, "sourceInput", event.target.value);
  persist();
});

elements.copyBriefButton.addEventListener("click", async () => {
  await copyText(state.briefPreview);
  showToast("Sprint brief copied");
});

elements.downloadBriefButton.addEventListener("click", () => {
  downloadBrief(state.workspaceName, state.briefPreview);
  showToast("Sprint brief downloaded");
});

elements.boardColumns.addEventListener("change", (event) => {
  const select = event.target.closest("[data-task-stage]");
  if (!select) {
    return;
  }

  state = moveTaskToStage(state, select.dataset.taskStage, select.value);
  persist();
  render();
  showToast("Task moved");
});

elements.boardColumns.addEventListener("dragstart", (event) => {
  const card = event.target.closest("[data-task-id]");
  if (!card) {
    return;
  }

  draggedTaskId = card.dataset.taskId;
  card.classList.add("dragging");
});

elements.boardColumns.addEventListener("dragend", (event) => {
  const card = event.target.closest("[data-task-id]");
  if (card) {
    card.classList.remove("dragging");
  }

  draggedTaskId = null;
  document.querySelectorAll(".board-column.drag-over").forEach((column) => column.classList.remove("drag-over"));
});

elements.boardColumns.addEventListener("dragover", (event) => {
  const column = event.target.closest(".board-column");
  if (!column || !draggedTaskId) {
    return;
  }

  event.preventDefault();
  column.classList.add("drag-over");
});

elements.boardColumns.addEventListener("dragleave", (event) => {
  const column = event.target.closest(".board-column");
  if (column) {
    column.classList.remove("drag-over");
  }
});

elements.boardColumns.addEventListener("drop", (event) => {
  const column = event.target.closest(".board-column");
  if (!column || !draggedTaskId) {
    return;
  }

  event.preventDefault();
  column.classList.remove("drag-over");
  state = moveTaskToStage(state, draggedTaskId, column.dataset.stage);
  persist();
  render();
  showToast("Task moved");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      console.warn("SprintPilot service worker registration failed");
    });
  });
}

render();
