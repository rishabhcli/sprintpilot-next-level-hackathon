import { createWorkspace } from "./state.js";

export const DEMO_INPUT = `Goal: Launch a student-friendly beta that turns chaotic meeting notes into a sprint plan.
- Monday standup notes: onboarding still feels too heavy for first-time founders and student builders.
- Need a shorter setup checklist before Thursday mentor demo.
- Fix the stalled reminder issue on slower campus Wi-Fi.
- Prepare an outreach email for five pilot teams and collect their feedback themes.
- Create a metrics snapshot for activation, weekly planning usage, and main drop-off reasons.
- Align on who owns design polish and QA before Friday.
- Record a 90-second walkthrough for mentors and startup advisors.
- Research how to turn freeform notes into tasks without external paid APIs.
- Deadline: ship a stable demo by Friday afternoon.`;

export function createSeedWorkspace(baseDate = new Date()) {
  return createWorkspace({
    workspaceName: "Launch Lab Crew",
    objective: "Stabilize the beta demo and give the team a believable weekly sprint",
    sourceInput: DEMO_INPUT,
    baseDate,
    mutateTasks(tasks) {
      return tasks.map((task, index) => {
        if (index === 0) {
          return { ...task, stage: "In Progress" };
        }

        if (index === 1 || index === 2) {
          return { ...task, stage: "Ready" };
        }

        if (index === 4) {
          return { ...task, stage: "Done" };
        }

        return task;
      });
    }
  });
}
