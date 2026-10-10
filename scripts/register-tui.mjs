#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { homedir } from "os"
import { join } from "path"

const CONFIG_DIR = join(homedir(), ".config", "opencode")
const CLI_JSON_PATH = join(CONFIG_DIR, "cli.json")
const PLUGIN_NAME = "opencode-side-panel-sessions"

function register() {
  console.log(`[opencode-side-panel-sessions] Setting up OpenCode CLI plugin registration…`)

  let config = { plugins: [] }

  if (existsSync(CLI_JSON_PATH)) {
    try {
      const raw = readFileSync(CLI_JSON_PATH, "utf-8")
      config = JSON.parse(raw)
    } catch {
      console.error(
        `[opencode-side-panel-sessions] Warning: could not parse ${CLI_JSON_PATH}. Creating new one.`,
      )
    }
  }

  if (!config.plugins) config.plugins = []

  if (!config.plugins.includes(PLUGIN_NAME)) {
    config.plugins.push(PLUGIN_NAME)

    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true })
    }

    writeFileSync(CLI_JSON_PATH, JSON.stringify(config, null, 2) + "\n")
    console.log(`[opencode-side-panel-sessions] ✅ Registered in ${CLI_JSON_PATH}`)
    console.log(`[opencode-side-panel-sessions] Restart OpenCode to activate.`)
  } else {
    console.log(`[opencode-side-panel-sessions] ✅ Already registered in ${CLI_JSON_PATH}`)
  }
}

register()
