import { ensureSolidTransformPlugin } from "@opentui/solid/bun-plugin"

// Register the SolidJS transform plugin with bun
ensureSolidTransformPlugin()

const result = await Bun.build({
  entrypoints: ["./src/tui.tsx"],
  outdir: "./dist",
  target: "node",
  format: "esm",
  external: [
    "@opencode-ai/plugin",
    "@opencode-ai/sdk",
    "@opentui/solid",
    "@opentui/core",
    "solid-js",
  ],
  naming: "[name].js",
})

if (!result.success) {
  console.error("Build failed:", result.logs)
  process.exit(1)
}

console.log("Build succeeded:", result.outputs.map((o) => o.path).join(", "))

// Generate TypeScript declarations
import { spawnSync } from "bun"

const tscResult = spawnSync(["bunx", "tsc", "--project", "tsconfig.build.json", "--emitDeclarationOnly"], {
  stdio: ["inherit", "inherit", "inherit"],
})

if (tscResult.exitCode !== 0) {
  console.error("Declaration generation failed (exit code: " + tscResult.exitCode + ")")
  process.exit(1)
}

console.log("Declarations generated in dist/")
