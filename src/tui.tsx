/** @jsxImportSource @opentui/solid */

import type { TuiPluginApi, TuiPluginMeta, TuiPluginModule } from "@opencode-ai/plugin/tui"
import type { PluginOptions } from "@opencode-ai/plugin"
import type { Session } from "@opencode-ai/sdk/v2"
import type { SessionInfo, SessionStatus, SessionsStore } from "./types"
import { createSignal, onCleanup, onMount } from "solid-js"
import { SessionPanel } from "./components/SessionPanel"

// ── Constants ────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 10_000
const SLOT_ORDER = 5 // Lower order = higher priority in sidebar_content slot
const PINNED_IDS_KEY = "sidebar-sessions-pinned"

// ── SessionStatus mapper (SDK → UI) ─────────────────────────────────────────

function mapSessionStatus(sdkStatus: import("@opencode-ai/sdk/v2").SessionStatus | undefined): SessionStatus {
  if (!sdkStatus) return "idle"

  switch (sdkStatus.type) {
    case "idle":
      return "idle"
    case "busy":
      return "working"
    case "retry":
      return "error"
    default:
      const _exhaustive: never = sdkStatus
      return "idle"
  }
}

// ── Session mapper (SDK Session → our SessionInfo) ──────────────────────────

function toSessionInfo(
  session: Session,
  status: import("@opencode-ai/sdk/v2").SessionStatus | undefined,
  pinnedIds: string[],
): SessionInfo {
  return {
    id: session.id,
    title: session.title || session.slug || session.id,
    status: mapSessionStatus(status),
    agent: session.agent,
    updatedAt: session.time?.updated ? new Date(session.time.updated) : new Date(),
    pinned: pinnedIds.includes(session.id),
  }
}

// ── Fetch sessions from the API ─────────────────────────────────────────────

async function fetchSessions(
  api: TuiPluginApi,
  pinnedIds: string[],
): Promise<SessionInfo[]> {
  const result = await api.client.session.list({ limit: 100 })
  const sessions = result.data ?? []

  // Filter out subagent sessions (those with a parentID) — only show top-level user sessions
  const topLevelSessions = sessions.filter((s) => !s.parentID)

  return topLevelSessions.map((s) => {
    const sdkStatus = api.state.session.status(s.id)
    return toSessionInfo(s, sdkStatus, pinnedIds)
  })
}

// ── Pinned IDs persistence ──────────────────────────────────────────────────

function loadPinnedIds(kv: { get: <V>(key: string, fallback?: V) => V }): string[] {
  try {
    const stored = kv.get<string[]>(PINNED_IDS_KEY, [])
    return Array.isArray(stored) ? stored : []
  } catch (err: unknown) {
    console.warn(`[sessions] Failed to load pinned IDs from KV: ${err instanceof Error ? err.message : String(err)}`)
    return []
  }
}

// NEW: throws on failure — caller must handle
function persistPinnedIds(kv: { set: (key: string, value: unknown) => void }, ids: string[]): void {
  kv.set(PINNED_IDS_KEY, ids)
}

// ── SolidJS component that owns ALL reactive state ─────────────────────────

interface SidePanelSessionsProps {
  api: TuiPluginApi
  navigate: (name: string, params?: Record<string, unknown>) => void
  log: (message: string) => void
  currentSessionId: string
}

function SidePanelSessions(props: SidePanelSessionsProps) {
  const { api, navigate, log } = props

  // ALL signals created INSIDE the component (proper SolidJS owner context)
  const [sessions, setSessions] = createSignal<SessionInfo[]>([])
  const [pinnedIds, setPinnedIds] = createSignal<string[]>(loadPinnedIds(api.kv))
  const [isLoading, setLoading] = createSignal(true)
  const [error, setError] = createSignal<string | null>(null)

  function togglePin(sessionId: string) {
    const current = pinnedIds()
    const next = current.includes(sessionId)
      ? current.filter((id) => id !== sessionId)
      : [...current, sessionId]

    // Optimistic UI update
    setPinnedIds(next)
    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, pinned: next.includes(sessionId) } : s
    ))

    // Persist — revert on failure
    try {
      persistPinnedIds(api.kv, next)
    } catch (err: unknown) {
      // Revert UI to previous state
      setPinnedIds(current)
      setSessions(prev => prev.map(s =>
        s.id === sessionId ? { ...s, pinned: current.includes(sessionId) } : s
      ))
      const msg = err instanceof Error ? err.message : "unknown KV write failure"
      console.error(`[sessions] Failed to persist pinned IDs: ${msg}`)
    }
  }

  // Set up event subscriptions, initial fetch, and polling on mount
  onMount(() => {
    let fetchSeq = 0

    function fetchAndDispatch(fetchPinned: string[]) {
      const seq = ++fetchSeq
      fetchSessions(api, fetchPinned)
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
    fetchAndDispatch(pinnedIds())

    // 2. Event subscriptions — re-fetch on any session event
    function handleEvent() { fetchAndDispatch(pinnedIds()) }
    const unsubscribes = [
      api.event.on("session.status", handleEvent),
      api.event.on("session.created", handleEvent),
      api.event.on("session.updated", handleEvent),
      api.event.on("session.deleted", handleEvent),
    ]

    // 3. Polling fallback
    const pollingTimer = setInterval(() => fetchAndDispatch(pinnedIds()), POLL_INTERVAL_MS)

    // Cleanup on unmount
    onCleanup(() => {
      for (const unsub of unsubscribes) unsub()
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
      navigate={navigate}
      log={log}
      currentSessionId={props.currentSessionId}
    />
  )
}

// ── Plugin entrypoint ───────────────────────────────────────────────────────

const plugin: TuiPluginModule = {
  id: "opencode-side-panel-sessions",

  async tui(api: TuiPluginApi, _options: PluginOptions | undefined, _meta: TuiPluginMeta): Promise<void> {
    // ── Guard: validate API at the boundary ──────────────────────────────
    if (!api || !api.client || !api.slots || !api.lifecycle || !api.kv || !api.event || !api.state || !api.route) {
      throw new Error("tui: received invalid TuiPluginApi — missing required properties")
    }

    api.slots.register({
      order: SLOT_ORDER,
      slots: {
        sidebar_content(_ctx: unknown, _props: { session_id: string }) {
          return (
            <SidePanelSessions
              api={api}
              currentSessionId={_props.session_id}
              navigate={(name, params) => api.route.navigate(name, params)}
              log={(message) => { api.client.app.log({ level: "info", message }) }}
            />
          )
        },
      },
    })

    // No onDispose needed — SidePanelSessions handles cleanup via onCleanup
  },
}

export default plugin
