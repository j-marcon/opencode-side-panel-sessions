/** @jsxImportSource @opentui/solid */

import { createEffect, createMemo, createSignal, onCleanup } from "solid-js"
import type { SessionStatus } from "../types"

// ── Constants ──────────────────────────────────────────────────────────────

const SPINNER_FRAMES = ["◐", "◓", "◑", "◒"]

// ── Status → color mapping ─────────────────────────────────────────────────

interface StatusDisplay {
  color: string
  symbol: string
}

function getStatusDisplay(status: SessionStatus): StatusDisplay {
  switch (status) {
    case "working":
      return { color: "green", symbol: "" }
    case "idle":
      return { color: "yellow", symbol: "●" }
    case "awaiting_input":
      return { color: "blue", symbol: "◇" }
    case "complete":
      return { color: "gray", symbol: "✓" }
    case "error":
      return { color: "red", symbol: "✗" }
    case "stopped":
      return { color: "gray", symbol: "■" }
    default:
      const _exhaustive: never = status
      return { color: "gray", symbol: "●" }
  }
}

// ── Props ──────────────────────────────────────────────────────────────────

export interface StatusBadgeProps {
  status: SessionStatus
}

/**
 * Renders a colored status symbol for a session.
 * For "working" status, shows an animated spinner (◐◓◑◒).
 * Pure-ish component: same input → same output, with animation on working.
 */
export function StatusBadge(props: StatusBadgeProps) {
  const [frame, setFrame] = createSignal(0)

  createEffect(() => {
    if (props.status === "working") {
      const timer = setInterval(() => setFrame((f) => (f + 1) % SPINNER_FRAMES.length), 200)
      onCleanup(() => clearInterval(timer))
    }
  })

  const { color, symbol } = getStatusDisplay(props.status)

  const displaySymbol = createMemo(() => {
    if (props.status === "working") {
      return SPINNER_FRAMES[frame()]
    }
    return symbol
  })

  return <text fg={color}>{displaySymbol()}</text>
}
