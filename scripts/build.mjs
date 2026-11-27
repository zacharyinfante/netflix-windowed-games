// Builds the loadable extension into dist/: compiles TS and copies static assets.
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

// 1) Compile TypeScript -> dist/*.js
execSync("npx tsc -p tsconfig.json", { cwd: root, stdio: "inherit" });

// 2) Copy static assets alongside the compiled JS
fs.copyFileSync(path.join(root, "manifest.json"), path.join(dist, "manifest.json"));
fs.copyFileSync(path.join(root, "static", "popup.html"), path.join(dist, "popup.html"));
fs.cpSync(path.join(root, "icons"), path.join(dist, "icons"), { recursive: true });

console.log("Built extension -> dist/  (load this folder as Unpacked in Chrome)");
