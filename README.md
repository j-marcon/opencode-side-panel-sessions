# OpenCode Side Panel Sessions

[![npm version](https://img.shields.io/npm/v/opencode-side-panel-sessions)](https://www.npmjs.com/package/opencode-side-panel-sessions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A [TUI plugin](https://opencode.ai/docs/plugins/tui) for [OpenCode](https://opencode.ai) that displays parallel and background agent sessions directly in the sidebar. Provides live status updates, session pinning with persistent storage, and one-click navigation — so you never lose track of what your agents are doing.

## Quick Start

### Option 1: Install via npm (recommended)

```bash
cd ~/.config/opencode
npm install opencode-side-panel-sessions
```

That's it — restart OpenCode and the sessions panel will appear in the sidebar.

> **Note**: The installation script automatically registers the plugin in your `tui.json`. No manual config editing needed.

### Option 2: Local Development Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/j-marcon/opencode-side-panel-sessions.git ~/src/opencode-side-panel-sessions
   ```

2. **Install dependencies:**

   ```bash
   cd ~/src/opencode-side-panel-sessions
   bun install
   ```

3. **Register the plugin** in `~/.config/opencode/tui.json`:

   ```json
   {
     "$schema": "https://opencode.ai/tui.json",
     "plugin": ["../../src/opencode-side-panel-sessions/src/tui.tsx"]
   }
   ```

   The path is relative to the `~/.config/opencode/` directory. Adjust if your project lives elsewhere.

4. **Restart OpenCode.** The sessions panel will appear in the sidebar automatically.

## Features

### Session List
Displays all top-level (non-subagent) sessions in the sidebar. Each entry shows a status symbol, truncated title (25 characters max), and a pin toggle.

### Three Sections: Current Session, Pinned + All Sessions

- **Current Session** — The session you're currently viewing (auto-detected), shown at the very top with live status and pin toggle.
- **Pinned** — Your starred sessions, always visible below the current session.
- **All Sessions** — All unpinned sessions, **collapsed by default** (click ▶ to expand). Sessions are grouped by date: Today, Yesterday, This Week, This Month, and Older.

Sections are hidden when they have no sessions to show. The current session is excluded from Pinned and All Sessions to avoid duplication.

### Status Symbols
- **Working** sessions display an animated spinner (`◐◓◑◒`) that rotates every 200ms.
- All other states show a static symbol with distinct colors for quick visual scanning.

### Live Updates
The panel stays up to date via two mechanisms:
1. **Event bus** — Listens for `session.status`, `session.created`, `session.updated`, and `session.deleted` events from OpenCode.
2. **Polling fallback** — Refreshes every 10 seconds to catch any missed events.

### Collapsible

Click the `▼ Sessions` header to collapse the entire panel. Click again (`▶ Sessions`) to expand. The All Sessions section has its own toggle (▶/▼) and starts collapsed to keep the panel compact.

### Pin / Unpin
Click the star icon next to any session to pin it (`☆` → `★`). Pinned sessions survive restarts — they are persisted in OpenCode's key-value store under the `sidebar-sessions-pinned` key. If the KV write fails, the pin change is reverted and an error is logged.

### One-Click Navigation
Click any session title to jump directly to that session. Navigation failures are caught and logged to OpenCode's app log.

## Status Symbol Reference

| Status          | Symbol             | Color  | Meaning                                      |
|-----------------|--------------------|--------|----------------------------------------------|
| Working         | ◐◓◑◒ *(animated)* | Green  | Session is actively processing               |
| Idle            | ●                  | Yellow | Session is waiting, no active work           |
| Awaiting Input  | ◇                  | Blue   | Session is paused, waiting for user input    |
| Complete        | ✓                  | Gray   | Session finished successfully                |
| Error           | ✗                  | Red    | Session encountered an error                 |
| Stopped         | ■                  | Gray   | Session was stopped by the user or system    |

## Usage Tips

- **Collapse / expand panel**: Click the `▼ Sessions` or `▶ Sessions` header to toggle the entire panel.
- **Collapse / expand All Sessions**: Click the `▶` or `▼` next to "All Sessions" to toggle date-grouped session list.
- **Pin a session**: Click the empty star (`☆`) next to a session title. The star fills in (`★`) to confirm.
- **Unpin a session**: Click the filled star (`★`) again to remove the pin.
- **Pins are persistent**: Pins are stored in OpenCode's key-value store and survive restarts. If a KV write fails, the pin reverts to its previous state automatically.
- **Truncation**: Session titles longer than 25 characters are truncated with an ellipsis (`…`) for a clean list.
- **Subagent filtering**: Sessions with a parent ID are excluded — only top-level user sessions are shown.

## Development

```bash
# Install dependencies
bun install

# Type-check the project
bun run typecheck

# Build for publishing
bun run build
```

### Project Structure

```
opencode-side-panel-sessions/
├── src/
│   ├── tui.tsx                       # Plugin entrypoint — registers the sidebar slot
│   ├── types.ts                      # Shared types: SessionInfo, SessionStatus, SessionsStore
│   └── components/
│       ├── SessionPanel.tsx          # Main panel with collapsible header, Pinned + All Sessions sections
│       ├── SessionItem.tsx           # Individual session row with title, status, pin toggle
│       └── StatusBadge.tsx           # Animated/static status symbol renderer
├── scripts/
│   └── build.ts                      # Build script using Bun.build() + tsc declarations
├── dist/                             # Compiled output (generated by build)
├── package.json                      # npm package manifest
├── tsconfig.json                     # TypeScript configuration
├── tsconfig.build.json               # Build-specific TypeScript config for declaration emit
├── .npmrc                            # npm publish configuration
├── CHANGELOG.md                      # Release history
├── LICENSE                           # MIT license
└── README.md                         # This file
```

## Publishing

### To npm

```bash
# Build the plugin
bun run build

# Publish to npm
npm publish
```

### To GitHub

```bash
# Create the repository on GitHub first, then:

git add .
git commit -m "Initial release: v0.1.0"
git branch -M main
git remote add origin https://github.com/j-marcon/opencode-side-panel-sessions.git
git push -u origin main
```

### Version Bump

Before publishing, update the version in `package.json`:

```bash
# Patch bump (bug fixes)
npm version patch

# Minor bump (new features, backwards compatible)
npm version minor

# Major bump (breaking changes)
npm version major
```

Then run `bun run build && npm publish && git push --tags`.

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for full details on how to contribute, including development setup, code style, and pull request process.

## Philosophy

This project adheres to the **5 Laws of Elegant Defense** (*code-philosophy*):

- **Early Exit** — Guard clauses at top of functions (e.g., `SessionItem` returns `null` for missing session, `loadPinnedIds` returns `[]` on failure).
- **Parse Don't Validate** — Data is parsed at boundaries (`mapSessionStatus` normalizes SDK types; `loadPinnedIds` coerces KV storage).
- **Atomic Predictability** — Pure functions where possible (`toSessionInfo`, `truncateTitle`, `getStatusDisplay`); side effects isolated in handlers.
- **Fail Fast** — Descriptive error messages propagated to the UI; attempt-pin failures revert and log.
- **Intentional Naming** — Function and variable names read like English (`togglePin`, `fetchSessions`, `displayTitle`, `pinnedSessions`).

## Links

- **GitHub**: [https://github.com/j-marcon/opencode-side-panel-sessions](https://github.com/j-marcon/opencode-side-panel-sessions)
- **npm**: [https://www.npmjs.com/package/opencode-side-panel-sessions](https://www.npmjs.com/package/opencode-side-panel-sessions)
- **OpenCode Plugins**: [https://opencode.ai/docs/plugins](https://opencode.ai/docs/plugins)

## License

MIT — see [LICENSE](LICENSE) for details.
