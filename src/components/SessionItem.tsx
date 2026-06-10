/** @jsxImportSource @opentui/solid */

import type { SessionInfo } from "../types"
import { StatusBadge } from "./StatusBadge"

const TITLE_MAX_LENGTH = 25
const ELLIPSIS = "…"

function truncateTitle(title: string, maxLength: number): string {
  if (title.length <= maxLength) return title
  return title.slice(0, maxLength).trimEnd() + ELLIPSIS
}

export interface SessionItemProps {
  session: SessionInfo
  togglePin: (id: string) => void
  navigate: (name: string, params?: Record<string, unknown>) => void
  log: (message: string) => void
  marginLeft?: number
}

export function SessionItem(props: SessionItemProps) {
  if (!props.session) return null

  const { session, togglePin, navigate, log, marginLeft = 0 } = props
  const displayTitle = truncateTitle(session.title, TITLE_MAX_LENGTH)
  const pinSymbol = () => props.session.pinned ? "★" : "☆"
  const fullTitle = ` ${displayTitle}`

  function handleNavigate() {
    try {
      navigate("session", { sessionID: session.id })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "unknown navigation error"
      log(`SessionItem: navigation failed for ${session.id}: ${message}`)
    }
  }

  function handleTogglePin() {
    try {
      togglePin(session.id)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "unknown pin toggle error"
      log(`SessionItem: pin toggle failed for ${session.id}: ${message}`)
    }
  }

  return (
    <box flexDirection="row" alignItems="center" marginLeft={marginLeft}>
      <StatusBadge status={session.status} />
      <text flexGrow={1} marginLeft={1} onMouseDown={handleNavigate}>
        {fullTitle}
      </text>
      <text marginLeft={1} onMouseDown={handleTogglePin}>
        {pinSymbol()}
      </text>
    </box>
  )
}
