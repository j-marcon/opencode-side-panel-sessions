# Contributing to OpenCode Side Panel Sessions

Thank you for considering contributing! This document outlines the process and conventions we follow.

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:

   ```bash
   git clone https://github.com/<your-username>/opencode-side-panel-sessions.git
   cd opencode-side-panel-sessions
   ```

3. **Install dependencies:**

   ```bash
   bun install
   ```

4. **Create a branch** for your work (see [Branch Naming](#branch-naming) below).

5. Make your changes — all source code lives in `src/`.

## Development Setup

For local development, register the plugin in your OpenCode `tui.json`:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": ["../../path/to/opencode-side-panel-sessions/src/tui.tsx"]
}
```

See the main [README](README.md#option-2-local-development-setup) for detailed instructions.

## Branch Naming

Use a prefix that describes the type of change, followed by a short kebab-case description:

- `feature/` — New functionality (e.g., `feature/session-search`)
- `fix/` — Bug fixes (e.g., `fix/pin-persistence-race`)
- `docs/` — Documentation changes (e.g., `docs/api-usage-examples`)

## Commit Style

Conventional commits (e.g., `feat:`, `fix:`, `docs:`) are **optional** but appreciated. The hard requirement is that every commit message **clearly describes what** was changed and **why**.

Good examples:
- `Add polling fallback for missed session events`
- `Fix pin state not persisting across panel reopens`
- `Update status symbol colors for better a11y`

Avoid vague messages like `fix stuff` or `update`.

## Code Quality

All contributions **must** pass the TypeScript type checker:

```bash
bun run typecheck
```

The codebase follows the **5 Laws of Elegant Defense**:

- **Early Exit** — Guard clauses at top of functions; return early for edge cases.
- **Parse Don't Validate** — Parse data at boundaries; internals work with trusted types.
- **Atomic Predictability** — Prefer pure functions; isolate side effects in handlers.
- **Fail Fast** — Propagate descriptive errors; never silently swallow failures.
- **Intentional Naming** — Names should read like English prose.

See the [Philosophy section](README.md#philosophy) in the README for concrete examples from this project.

## Pull Request Process

1. Open your PR against the `main` branch.
2. Reference any related issues in the description (e.g., `Closes #42`).
3. Ensure `bun run typecheck` and `bun run build` pass.
4. Keep changes focused — one feature or fix per PR.
5. A maintainer will review your PR and may request changes.

## Package Publishing

This project is published on [npm](https://www.npmjs.com/package/opencode-side-panel-sessions). Published source is in the `src/` directory; the `dist/` directory contains the compiled output and is not committed.

---

Thank you for helping improve OpenCode Side Panel Sessions!
