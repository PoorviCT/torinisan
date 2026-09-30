## Product
Don't Break the Chain: browser sequence-puzzle game. Critical flows: start a timed round; solve a sequence; rotate rules after three correct answers; increase chain and combo milestones; fail on wrong answer; fail on timeout; replay; retain best chain across reload.
## Tech Stack
Next.js 16 App Router, React 19, TypeScript; browser-only game engine and localStorage; no server API or database.
## Test Stack
Vitest 4 unit tests in src/game/*.test.ts and src/app/game.test.tsx; Playwright 1.63 in playwright.config.ts, tests/game.e2e.ts.
## CI/CD
No workflow found in repository; developer reported local lint/typecheck/build/test runs. PR #1 targets main.
## Environments
Local Next.js on port 3000; no staging or production URL supplied; no external services.
## Quality Goals
For this review: all 17 criteria mapped; zero unexplained critical E2E failures; no flaky tests accepted; focused E2E under 15 minutes. No established repository-wide coverage target.
## Risk Areas
| Area | Risk level | Business impact | Notes |
|---|---|---|---|
| Unique puzzle answer and advanced fairness | Critical | Ambiguous puzzles undermine core game | Automated uniqueness does not prove human fairness |
| Deadline and input race | Critical | Incorrect chain scoring | Check first accepted action and timeout |
| Tier progression and rule rotation | Important | Difficulty promise broken | Boundary ranges and rotation |
| Color/size redundant cues | Important | Excludes users | Human accessibility review pending |
| Browser storage failure | Monitor | Best score lost | In-memory fallback required |
## Team
Developer and QA agent roles observed; human headcount and dev:QA ratio not recorded. QA engages at PR review.
## Conventions
Existing tests in tests/*.e2e.ts and src/**/*.test.ts; prefer getByRole/getByLabel semantic locators, then test IDs. Fresh browser contexts isolate localStorage; deterministic source-level puzzle fixtures where possible. QA branch stacks on developer PR.
