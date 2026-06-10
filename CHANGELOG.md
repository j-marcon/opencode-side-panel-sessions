# Changelog

## [0.1.0] — 2026-06-10

### Added
- Sidebar TUI plugin displaying OpenCode agent sessions live
- Two-section layout: Pinned + All Sessions
- Current Session subsection showing the session you're viewing
- Date-grouped subsubsections for All Sessions (Today, Yesterday, This Week, This Month, Older)
- All Sessions section collapsible and collapsed by default
- Animated status spinner for working sessions
- Live updates via event bus + 10s polling fallback
- Session pinning with KV persistence (survives restarts)
- One-click navigation to any session
- Subagent filtering (parentID sessions excluded)
- Automatic postinstall registration in tui.json

### Fixed
- Pin star reactivity: star icon now updates immediately on toggle
