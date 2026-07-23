/** @jsxImportSource @opentui/solid */

import { createSignal, createMemo, For } from "solid-js"
import { TextAttributes } from "@opentui/core"
import type { SessionInfo } from "../types"
import type { SessionsStore } from "../types"
import { SessionItem } from "./SessionItem"

function getDateBucket(date: Date): string {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)
  const startOfThisWeek = new Date(startOfToday)
  startOfThisWeek.setDate(startOfThisWeek.getDate() - startOfThisWeek.getDay())
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dTime = d.getTime()

  if (dTime === startOfToday.getTime()) return "Today"
  if (dTime === startOfYesterday.getTime()) return "Yesterday"
  if (dTime >= startOfThisWeek.getTime()) return "This Week"
  if (dTime >= startOfThisMonth.getTime()) return "This Month"
  return "Older"
}

export interface SessionPanelProps {
  sessions: SessionsStore
  navigate: (name: string, params?: Record<string, unknown>) => void
  log: (message: string) => void
  currentSessionId?: string
}

export function SessionPanel(props: SessionPanelProps) {
  const { sessions, navigate, log, currentSessionId } = props

  const [collapsed, setCollapsed] = createSignal(false)
  const [allCollapsed, setAllCollapsed] = createSignal(false)  // All Sessions expanded by default

  const allSessions = () => sessions.sessions()

  // Current session — separate from other lists
  const currentSession = createMemo(() =>
    currentSessionId ? allSessions().find(s => s.id === currentSessionId) : undefined
  )

  // Other sessions (exclude current session)
  const otherSessions = createMemo(() =>
    currentSessionId ? allSessions().filter(s => s.id !== currentSessionId) : allSessions()
  )

  const pinnedSessions = createMemo(() => otherSessions().filter(s => s.pinned))
  const unpinnedSessions = createMemo(() => otherSessions().filter(s => !s.pinned))

  // Group unpinned sessions by date, preserving order
  const dateGroups = createMemo(() => {
    const buckets: Record<string, SessionInfo[]> = {}
    const order: string[] = []

    function ensureBucket(label: string) {
      if (!buckets[label]) { buckets[label] = []; order.push(label) }
    }

    for (const s of unpinnedSessions()) {
      const bucket = getDateBucket(s.updatedAt)
      ensureBucket(bucket)
      buckets[bucket].push(s)
    }

    return order.map(label => ({ label, sessions: buckets[label] }))
  })

  return (
    <box flexDirection="column">
      {/* ── Header ────────────────────────────── */}
      <box flexDirection="row" alignItems="center">
        <text onMouseDown={() => setCollapsed(c => !c)}>{collapsed() ? "▶" : "▼"}</text>
        <text onMouseDown={() => setCollapsed(c => !c)} attributes={TextAttributes.BOLD} marginLeft={1}>Sessions</text>
      </box>

      {() => !collapsed() && (
        <>
          {/* ── Loading / Error states ─────────── */}
          {() => sessions.isLoading() && <text marginLeft={1}>Loading sessions…</text>}
          {() => !sessions.isLoading() && sessions.error() && <text marginLeft={1} fg="red">{sessions.error()}</text>}

          {/* ── Current Session Section (top) ──── */}
          {() => !sessions.isLoading() && !sessions.error() && currentSession() && (
            <box flexDirection="column">
              <text marginLeft={1} attributes={TextAttributes.BOLD | TextAttributes.DIM}>Current Session</text>
              <SessionItem
                session={currentSession()!}
                togglePin={(id) => sessions.togglePin(id)}
                navigate={navigate}
                log={log}
                marginLeft={2}
              />
            </box>
          )}

          {/* ── Pinned Section (always visible) ── */}
          {() => !sessions.isLoading() && !sessions.error() && pinnedSessions().length > 0 && (
            <box flexDirection="column">
              <text marginLeft={1} attributes={TextAttributes.BOLD | TextAttributes.DIM}>Pinned</text>
              <For each={pinnedSessions()}>
                {(s: SessionInfo) => (
                  <SessionItem
                    session={s}
                    togglePin={(id) => sessions.togglePin(id)}
                    navigate={navigate}
                    log={log}
                    marginLeft={2}
                  />
                )}
              </For>
            </box>
          )}

          {/* ── All Sessions Section (collapsible, collapsed by default) ── */}
          {() => !sessions.isLoading() && !sessions.error() && unpinnedSessions().length > 0 && (
            <box flexDirection="column">
              <box flexDirection="row" alignItems="center">
                <text marginLeft={1} onMouseDown={() => setAllCollapsed(c => !c)}>{allCollapsed() ? "▶" : "▼"}</text>
                <text onMouseDown={() => setAllCollapsed(c => !c)} attributes={TextAttributes.BOLD | TextAttributes.DIM} marginLeft={1}>All Sessions</text>
              </box>
              {() => !allCollapsed() && (
                <box flexDirection="column">
                  <For each={dateGroups()}>
                    {(group) => (
                      <box flexDirection="column">
                        <text marginLeft={2} attributes={TextAttributes.BOLD | TextAttributes.DIM}>{group.label}</text>
                        <For each={group.sessions}>
                          {(s: SessionInfo) => (
                            <SessionItem
                              session={s}
                              togglePin={(id) => sessions.togglePin(id)}
                              navigate={navigate}
                              log={log}
                              marginLeft={3}
                            />
                          )}
                        </For>
                      </box>
                    )}
                  </For>
                </box>
              )}
            </box>
          )}
        </>
      )}
    </box>
  )
}
