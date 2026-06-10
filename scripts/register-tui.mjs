#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { homedir } from "os"
import { join } from "path"

const CONFIG_DIR = join(homedir(), ".config", "opencode")
const TUI_JSON_PATH = join(CONFIG_DIR, "tui.json")
const PLUGIN_NAME = "opencode-side-panel-sessions"

function register() {
  console.log(`[opencode-side-panel-sessions] Setting up OpenCode TUI plugin registration…`)

  let config = { $schema: "https://opencode.ai/tui.json", plugin: [] }

  if (existsSync(TUI_JSON_PATH)) {
    try {
      const raw = readFileSync(TUI_JSON_PATH, "utf-8")
      config = JSON.parse(raw)
    } catch {
      console.error(
        `[opencode-side-panel-sessions] Warning: could not parse ${TUI_JSON_PATH}. Creating new one.`,
      )
    }
  }

  if (!config.plugin) config.plugin = []

  if (!config.plugin.includes(PLUGIN_NAME)) {
    config.plugin.push(PLUGIN_NAME)

    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true })
    }

    writeFileSync(TUI_JSON_PATH, JSON.stringify(config, null, 2) + "\n")
    console.log(`[opencode-side-panel-sessions] ✅ Registered in ${TUI_JSON_PATH}`)
    console.log(`[opencode-side-panel-sessions] Restart OpenCode to activate.`)
  } else {
    console.log(`[opencode-side-panel-sessions] ✅ Already registered in ${TUI_JSON_PATH}`)
  }
}

register()
