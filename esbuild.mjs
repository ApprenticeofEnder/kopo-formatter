import { build } from "esbuild";

build({
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/extension.js",
  platform: "node",
  target: "node20",
  format: "cjs",
  external: ["vscode"],
  sourcemap: true,
}).catch(() => process.exit(1));
