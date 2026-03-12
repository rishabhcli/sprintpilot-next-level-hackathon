import test from "node:test";
import assert from "node:assert/strict";

import { buildSprintBrief } from "../app/src/exporter.js";
import { createSeedWorkspace } from "../app/src/demo.js";

test("buildSprintBrief includes objective, roadmap, and board snapshot", () => {
  const workspace = createSeedWorkspace(new Date("2026-03-11T10:00:00-08:00"));
  const brief = buildSprintBrief(workspace);

  assert.match(brief, /Sprint Brief: Launch Lab Crew/);
  assert.match(brief, /Objective: Stabilize the beta demo/);
  assert.match(brief, /## Weekly Roadmap/);
  assert.match(brief, /## Board Snapshot/);
  assert.match(brief, /Backlog:/);
});
