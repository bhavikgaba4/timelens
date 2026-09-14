# TimeLens AI

TimeLens AI is a local task-planning proof of concept for a university demonstration. It compares a person's estimates with their completed-task history, produces a more realistic duration, lays out a daily timeline, and adjusts later work when something runs late.

> This MVP uses an explainable statistical baseline rather than a trained machine-learning model.

## MVP features

- Create, delete, and complete tasks without authentication or a separate backend.
- Store task data and completion history in local SQLite through Prisma.
- Explain each predicted duration with category, time-of-day, and interruption factors.
- Build a deterministic plan from 9:00 AM using deadline, priority, and predicted duration.
- Simulate a 35-minute delay and move the delayed task plus every later pending task.
- Record actual duration on completion and update the lightweight analytics panel.
- Restore consistent demonstration data with **Reset demo**.

## Architecture

Everything runs inside one Next.js App Router application:

```text
src/app          Server-rendered dashboard and server actions
src/components   Interactive dashboard components
src/lib          Prisma client, prediction, scheduling, analytics, seed fixtures
src/types        Framework-independent planning types
prisma           SQLite schema and seed entry point
tests            Focused Vitest calculation tests
```

The browser calls Next.js server actions for mutations. Those actions use Prisma directly, then revalidate the dashboard. There is no external API, cloud service, account, or authentication layer.

## Prediction formula

For each new task, TimeLens reads completed `TaskHistory` records from the same category:

```text
prediction = estimate × blended category bias × time-of-day factor
             + interruption overhead
```

- Category bias is the median `actual / estimate` ratio, blended toward a 1.10 default until six matching records exist.
- Morning uses `0.95`, afternoon uses `1.15`, and evening uses `1.05`.
- Interruption overhead is three minutes per average historical interruption, capped at 15 minutes.
- The result is rounded and constrained to a practical range. Confidence rises from LOW to HIGH as matching history grows.

The seeded Technical Report history has a 1.25 category bias and three average interruptions. A 60-minute task preferred for 2:00 PM therefore becomes `60 × 1.25 × 1.15 + 9 = 95.25`, rounded to **95 minutes**.

## Scheduling rules

1. Completed tasks are ignored and their saved schedule fields are never changed.
2. Pending tasks are ordered by deadline; priorities break deadlines within two hours.
3. The plan begins at 9:00 AM and runs tasks sequentially using predicted minutes.
4. A task is marked at risk if its scheduled end is after its deadline.
5. A simulated delay shifts the delayed task's end and every later pending task by 35 minutes.

## Database schema

SQLite contains exactly two application models:

| Model | Purpose |
| --- | --- |
| `Task` | Current title, category, estimate, prediction, priority, deadline, schedule, status, actual duration, interruption count, and timestamps. |
| `TaskHistory` | Immutable completion snapshots used for future predictions and analytics. |

`Priority` is `LOW`, `MEDIUM`, or `HIGH`; a task is `PENDING` or `COMPLETED`.

## Setup and run

Use Node.js 20 or later.

```bash
npm install
npm run setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `npm run setup` generates Prisma Client, creates/updates the SQLite database, and loads fresh demo data. To run the calculation checks:

```bash
npm test
```

## Demonstration sequence

The recorded demonstration is available as [MP4](docs/demo.mp4) and [WebM](docs/demo.webm). To recreate it while the local server is running, use `npm run demo:record`, `npm run demo:mp4`, then `npm run db:seed` to restore the original demo state.

1. Open the seeded dashboard and point out the four planned tasks and the learning panel.
2. Enter `Technical Report`, a `60` minute estimate, a 3:00 PM deadline, and an afternoon preferred start (the form defaults to 2:00 PM).
3. Add the task and show its **95m** predicted duration, factor cards, and explanation.
4. Inspect its place in the daily timeline; the schedule uses corrected durations.
5. Select **+35m delay** on the new report and show that every later pending task moves 35 minutes.
6. Enter an actual duration, click **Complete**, and show the completed count and analytics update. Use **Reset demo** to repeat from the original state.

## Known limitations

- The planner creates one sequential day and does not model breaks, calendars, working-hour limits, dependencies, or recurring tasks.
- The prediction is deliberately a transparent statistical baseline, with no model training or personalization across users.
- Preferred start is used for the initial time-of-day prediction only; it is not a persisted scheduling constraint because the MVP schema stays intentionally small.

## Phase 2 ideas

- Multiple planning days, availability windows, and task dependencies.
- More detailed interruption capture and trend visualizations.
- A user-controlled calibration view and richer model evaluation.
- Optional export and calendar integrations, while keeping the core planner understandable.
