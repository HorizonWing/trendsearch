import { defineConfig } from "tsdown";

export default defineConfig({
  // Keep package contract explicit in package.json instead of auto-mutating it.
  exports: false,
  entry: {
    index: "src/index.ts",
    cli: "src/cli/main.ts",
  },
});
