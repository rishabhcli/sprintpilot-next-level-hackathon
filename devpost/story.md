# SprintPilot

SprintPilot is a local-first planning workspace that turns messy meeting notes, launch goals, and startup chaos into a focused weekly sprint. It is built for student founders, club teams, and hackathon builders who need structure fast without adding more management overhead.

## Inspiration

A lot of student teams do their best work in bursts: class projects, hackathons, side projects, startup clubs, and product demos all generate messy notes, scattered priorities, and vague next steps. The idea behind SprintPilot was to make that messy input immediately actionable. Instead of another document tool or kanban template, the product takes rough notes and turns them into a sprint that already feels ready to run.

## What it does

SprintPilot converts freeform notes into a structured planning system:

- extracts meaningful tasks from raw notes
- scores tasks with urgency and impact signals
- groups work into a weekly roadmap
- organizes the output into a kanban-style board
- generates a shareable sprint brief for the team
- works offline and stores everything locally in the browser

The result is a lightweight operating system for moving from brainstorm to execution.

## How we built it

The app is a static web application built with HTML, CSS, and JavaScript ES modules. The core planning logic lives in modular browser-side code, and the product uses deterministic heuristics instead of external paid APIs so it can run anywhere without secrets.

Key implementation choices:

- local-first storage with `localStorage`
- offline support with a service worker
- GitHub Pages-friendly build output in `docs/`
- automated tests using Node's built-in test runner
- build and verification scripts to keep the project deployable and reproducible

## Challenges we ran into

The hardest part was making the planning output feel useful immediately without relying on an external backend or LLM service. The app needed to turn rough input into a believable sprint plan, assign priorities, and stay simple enough to demo quickly. Another challenge was keeping the experience polished while remaining fully static and easy to deploy.

## What we learned

We learned that a strong demo does not need a heavy stack. Careful product framing, good heuristics, and a clean interface can create something that feels intelligent and useful even when it runs entirely in the browser. We also reinforced the value of building verifiable, low-friction tools that can ship fast.

## What's next

Next steps for SprintPilot include richer planning templates, smarter team collaboration flows, calendar-aware scheduling, and optional integrations for sharing sprint briefs into the tools teams already use.

## Impact

SprintPilot fits the Next Level Hackathon theme because it turns product thinking into execution. It is practical, startup-friendly, and immediately useful for teams that need to move faster. The project emphasizes product innovation, real usability, and a polished end-to-end workflow rather than just a concept demo.
