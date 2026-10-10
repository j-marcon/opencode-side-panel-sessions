/** @jsxImportSource @opentui/solid */

import { Plugin } from "@opencode/plugin/tui"
import type { Context } from "@opencode/plugin/tui/context"
import { createSignal, onCleanup, onMount } from "solid-js"
import { SessionPanel } from "./src/components/SessionPanel"
import type { SessionInfo, SessionStatus, SessionsStore } from "./src/types"

// ── Constants ────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 10_000
const PIN_STORE_KEY = "sidebar-sessions-pinned"

// ── Server session type (derived from context — no direct client import) ─────

type ServerSession = Awaited<ReturnType<Context["client"]["session"]["list"]>>["data"][number]
type LiveStatus = ReturnType<Context["data"]["session"]["status"]>

// ── SessionStatus mapper (live status + outcome → UI) ────────────────────────

function mapSessionStatus(status: LiveStatus, outcome: ServerSession["outcome"]): SessionStatus {
  if (status === "running") return "working"
  if (outcome === "failed") return "error"
  if (outcome === "interrupted") return "stopped"
  if (outcome === "succeeded") return "complete"
  return "idle"
}

// ── Session mapper (server SessionInfo → our SessionInfo) ───────────────────

function toSessionInfo(session: ServerSession, status: LiveStatus, pinnedIds: string[]): SessionInfo {
  return {
    id: session.id,
    title: session.title || session.id,
    status: mapSessionStatus(status, session.outcome),
    agent: session.agent,
    updatedAt: new Date(session.time.updated),
    pinned: pinnedIds.includes(session.id),
  }
}

// ── Fetch sessions from the API ─────────────────────────────────────────────

async function fetchSessions(ctx: Context, pinnedIds: string[]): Promise<SessionInfo[]> {
  const result = await ctx.client.session.list({ limit: 100 })
  const sessions = Array.isArray(result?.data) ? result.data : []

  // Filter out subagent sessions (those with a parentID) — only show top-level user sessions
  const topLevelSessions = sessions.filter((s) => !s.parentID)

  return topLevelSessions.map((s) => toSessionInfo(s, ctx.data.session.status(s.id), pinnedIds))
}

// ── SolidJS component that owns ALL reactive state ─────────────────────────

interface SidePanelSessionsProps {
  ctx: Context
  currentSessionId: string
}

function SidePanelSessions(props: SidePanelSessionsProps) {
  const { ctx } = props

  // Durable pin storage — survives restarts, syncs across TUI instances
  const [pinStore, updatePins] = ctx.storage.store(PIN_STORE_KEY, { initial: { ids: [] as string[] } })

  // ALL signals created INSIDE the component (proper SolidJS owner context)
  const [sessions, setSessions] = createSignal<SessionInfo[]>([])
  const [isLoading, setLoading] = createSignal(true)
  const [error, setError] = createSignal<string | null>(null)

  const pinnedIds = () => pinStore.ids ?? []

  function togglePin(sessionId: string) {
    const current = pinnedIds()
    const next = current.includes(sessionId)
      ? current.filter((id) => id !== sessionId)
      : [...current, sessionId]

    // Optimistic UI update
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, pinned: next.includes(sessionId) } : s)),
    )

    // Persist — revert on failure
    void updatePins((draft) => {
      draft.ids = next
    }).catch((err: unknown) => {
      // Revert UI to previous state
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, pinned: current.includes(sessionId) } : s)),
      )
      console.error(
        `[sessions] Failed to persist pinned IDs: ${err instanceof Error ? err.message : String(err)}`,
      )
    })
  }

  // Set up event subscriptions, initial fetch, and polling on mount
  onMount(() => {
    let fetchSeq = 0

    function fetchAndDispatch() {
      const seq = ++fetchSeq
      const pins = pinnedIds()
      fetchSessions(ctx, pins)
        .then((result) => {
          if (seq === fetchSeq) {
            setSessions(result)
            setLoading(false)
            setError(null)
          }
        })
        .catch((err) => {
          if (seq === fetchSeq) {
            setLoading(false)
            setError(err instanceof Error ? err.message : String(err))
          }
        })
    }

    // 1. Initial load
    setLoading(true)
    fetchAndDispatch()

    // 2. Refresh on any server event (renamed, deleted, execution, idle, …)
    const stopListening = ctx.data.listen(() => fetchAndDispatch())

    // 3. Polling fallback
    const pollingTimer = setInterval(fetchAndDispatch, POLL_INTERVAL_MS)

    // Cleanup on unmount
    onCleanup(() => {
      stopListening()
      clearInterval(pollingTimer)
    })
  })

  // Build the store object with SIGNALS (accessors), not values
  const store: SessionsStore = {
    sessions,
    pinnedIds,
    isLoading,
    error,
    togglePin,
  }

  return (
    <SessionPanel
      sessions={store}
      navigate={(sessionId) => ctx.ui.router.navigate({ type: "session", sessionID: sessionId })}
      log={(message) => console.error(`[sessions] ${message}`)}
      currentSessionId={props.currentSessionId}
    />
  )
}

// ── Plugin entrypoint (V2) ───────────────────────────────────────────────────

export default Plugin.define({
  id: "opencode-side-panel-sessions",

  setup(ctx) {
    return ctx.ui.slot({
      append: "sidebar.content",
      render: (input) => <SidePanelSessions ctx={ctx} currentSessionId={input.sessionID} />,
    })
  },
})
