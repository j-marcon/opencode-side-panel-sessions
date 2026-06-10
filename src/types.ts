import type { Accessor } from "solid-js"

/** Represents the status of a session as displayed in the UI sidebar */
export type SessionStatus =
  | "idle"
  | "awaiting_input"
  | "complete"
  | "error"
  | "stopped"
  | "working"

/** A single session displayed in the sidebar panel */
export interface SessionInfo {
  id: string
  title: string
  status: SessionStatus
  agent?: string
  updatedAt: Date
  pinned?: boolean
}

/** Reactive store shape — SessionPanel reads raw data, not filtered */
export interface SessionsStore {
  sessions: Accessor<SessionInfo[]>
  pinnedIds: Accessor<string[]>
  isLoading: Accessor<boolean>
  error: Accessor<string | null>
  togglePin: (sessionId: string) => void
}

