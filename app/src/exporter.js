import { groupTasksByDay, sortTasksForDisplay } from "./planner.js";

function boardSnapshot(tasks) {
  return tasks.reduce((counts, task) => {
    counts[task.stage] = (counts[task.stage] ?? 0) + 1;
    return counts;
  }, {});
}

export function buildSprintBrief(state) {
  const sortedTasks = sortTasksForDisplay(state.tasks);
  const groupedDays = groupTasksByDay(state.tasks, state.week);
  const counts = boardSnapshot(state.tasks);

  const lines = [
    `# Sprint Brief: ${state.workspaceName}`,
    "",
    `Objective: ${state.objective}`,
    `Week: ${state.weekLabel}`,
    `Generated: ${new Date(state.generatedAt).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short"
    })}`,
    "",
    "## Focus",
    `- ${state.summary.focus}`,
    `- Risk watch: ${state.summary.risk}`,
    `- Operating rhythm: ${state.summary.rhythm}`,
    "",
    "## Priority Queue",
    ...sortedTasks.map(
      (task) =>
        `- ${task.title} [Priority ${task.priority} | Urgency ${task.urgency} | Impact ${task.impact} | ${task.timebox}]`
    ),
    "",
    "## Weekly Roadmap",
    ...groupedDays.flatMap((day) => {
      const taskLines =
        day.tasks.length > 0
          ? day.tasks.map((task) => `  - ${task.title} (${task.stage}, ${task.timebox})`)
          : ["  - Keep this day open for overflow or recovery."];

      return [`- ${day.label} ${day.dateLabel}`, ...taskLines];
    }),
    "",
    "## Board Snapshot",
    `- Backlog: ${counts.Backlog ?? 0}`,
    `- Ready: ${counts.Ready ?? 0}`,
    `- In Progress: ${counts["In Progress"] ?? 0}`,
    `- Done: ${counts.Done ?? 0}`
  ];

  return lines.join("\n");
}

export async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const helper = document.createElement("textarea");
  helper.value = text;
  helper.style.position = "fixed";
  helper.style.opacity = "0";
  document.body.append(helper);
  helper.select();
  document.execCommand("copy");
  helper.remove();
  return true;
}

export function downloadBrief(workspaceName, briefText) {
  const slug = workspaceName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const blob = new Blob([briefText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${slug || "sprintpilot"}-brief.txt`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
