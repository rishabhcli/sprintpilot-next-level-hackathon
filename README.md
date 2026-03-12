# SprintPilot

SprintPilot is a local-first productivity web app built for Next Level Hackathon. It helps students, indie builders, and small startup teams turn rough goals, meeting notes, and product chaos into a structured weekly sprint with clear priorities.

The app is genuinely functional offline and locally. It runs as a static site, stores data in the browser, builds to `docs/` for GitHub Pages, and does not require any secrets, servers, or paid APIs.

## What It Does

- Turns freeform notes into a prioritized sprint plan
- Scores tasks by urgency and impact, then estimates effort
- Organizes work into a staged Kanban board
- Maps the sprint across a Monday-Friday roadmap
- Ships with realistic demo data so the product looks alive immediately
- Exports a copyable and downloadable sprint brief
- Persists the workspace with `localStorage`
- Caches the app shell with a service worker for reliable local/offline use

## Why This Fits The Hackathon

Next Level Hackathon emphasizes AI-flavored product innovation and startup-ready execution. SprintPilot focuses on the practical gap between brainstorming and shipping:

- students need a fast way to convert class projects and club meetings into action
- startup teams need a clean operating rhythm without adding more process overhead
- early builders need a believable prototype that feels useful on day one

Instead of a passive landing page, SprintPilot is a working local planning tool with deterministic planning logic, interaction design, and deployable static output.

## Stack

- Static HTML, CSS, and ES modules in [`app/`](/Users/rishabhbansal/.openclaw/workspace/hackathons/nextlevelhackathon/app)
- Node-based build, serve, and verify scripts in [`scripts/`](/Users/rishabhbansal/.openclaw/workspace/hackathons/nextlevelhackathon/scripts)
- Automated tests with the built-in Node test runner in [`tests/`](/Users/rishabhbansal/.openclaw/workspace/hackathons/nextlevelhackathon/tests)
- GitHub Pages-friendly build output in [`docs/`](/Users/rishabhbansal/.openclaw/workspace/hackathons/nextlevelhackathon/docs)

## Local Development

1. Install the project:

   ```bash
   npm install
   ```

2. Start the local app server:

   ```bash
   npm run dev
   ```

3. Open `http://localhost:3000`

## Scripts

- `npm run dev` serves the editable app from `app/`
- `npm test` runs the planning and export tests
- `npm run build` copies the deployable site into `docs/`
- `npm run start` serves the built output from `docs/`
- `npm run verify` runs tests, rebuilds the site, and checks core project state

## GitHub Pages Deployment

SprintPilot is already set up for GitHub Pages style hosting:

- source lives in `app/`
- build output lands in `docs/`
- asset paths are relative
- `.nojekyll` is created on build

Deploy by pushing the repository and configuring Pages to serve from the `docs/` folder on the default branch.

## Product Walkthrough

### 1. Sprint Intake

Paste rough goals, standup notes, blockers, or problem statements into the intake panel. Update the workspace name and sprint objective as needed.

### 2. Planner Engine

Click `Generate sprint plan` and SprintPilot will:

- extract meaningful action statements
- score urgency and impact
- estimate effort
- sort the resulting task queue
- place tasks into initial board stages
- assign work across the current week

### 3. Execution Layer

Use the task board to move items between `Backlog`, `Ready`, `In Progress`, and `Done`. The sprint brief updates as the board changes.

### 4. Export

Copy or download the generated sprint brief for Slack, email, docs, or a standup handoff.

## Project Structure

```text
app/                    Static app source
app/src/                Planner, state, storage, and export logic
tests/                  Automated tests
scripts/                Build, serve, and verify scripts
docs/                   Built output for GitHub Pages
artifacts/verification.md
```

## Verification

Core verification lives in [`artifacts/verification.md`](/Users/rishabhbansal/.openclaw/workspace/hackathons/nextlevelhackathon/artifacts/verification.md). The intended QA flow is:

```bash
npm install
npm test
npm run build
npm run verify
```

## Notes

- No external APIs are used
- No credentials are required
- The app is designed to be demonstrable immediately with the included demo workspace
- The repository is ready for QA and public hosting, but screenshots and Devpost submission assets were intentionally left untouched in this pass
