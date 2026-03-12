import test from "node:test";
import assert from "node:assert/strict";

import { extractSegments, generateSprintPlan, groupTasksByDay, groupTasksByStage } from "../app/src/planner.js";

test("extractSegments keeps meaningful planning statements", () => {
  const segments = extractSegments(`
    - Need a shorter setup checklist before Thursday
    - Fix the mentor demo bug on campus Wi-Fi.
    - Fix the mentor demo bug on campus Wi-Fi.
  `);

  assert.deepEqual(segments, [
    "Need a shorter setup checklist before Thursday",
    "Fix the mentor demo bug on campus Wi-Fi"
  ]);
});

test("generateSprintPlan creates prioritized tasks and a full workweek", () => {
  const plan = generateSprintPlan(
    `
      Launch the beta by Friday afternoon.
      Fix the stalled reminder issue before mentor demo.
      Prepare outreach notes for pilot teams.
      Capture a metrics snapshot for activation.
    `,
    {
      objective: "Ship a stable beta week",
      baseDate: new Date("2026-03-11T10:00:00-08:00")
    }
  );

  assert.equal(plan.week.length, 5);
  assert.ok(plan.tasks.length >= 4);
  assert.ok(plan.tasks[0].priority >= plan.tasks[plan.tasks.length - 1].priority);
  assert.ok(plan.tasks.every((task) => task.dueDay));
  assert.match(plan.summary.headline, /Ship a stable beta week/);
});

test("grouping helpers preserve every task once", () => {
  const plan = generateSprintPlan(
    `
      Run mentor walkthrough.
      Fix onboarding checklist.
      Align on QA owner.
    `,
    {
      objective: "Tighten this week's sprint",
      baseDate: new Date("2026-03-11T10:00:00-08:00")
    }
  );

  const stageTotal = groupTasksByStage(plan.tasks).reduce((total, group) => total + group.tasks.length, 0);
  const dayTotal = groupTasksByDay(plan.tasks, plan.week).reduce((total, group) => total + group.tasks.length, 0);

  assert.equal(stageTotal, plan.tasks.length);
  assert.equal(dayTotal, plan.tasks.length);
});
