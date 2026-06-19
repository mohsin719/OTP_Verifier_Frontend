import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");
const serverJs = path.join(standaloneDir, "server.js");

if (!fs.existsSync(serverJs)) {
  console.error("[deploy] Missing .next/standalone/server.js — run next build first.");
  process.exit(1);
}

const copies = [
  [path.join(root, ".next", "static"), path.join(standaloneDir, ".next", "static")],
  [path.join(root, "public"), path.join(standaloneDir, "public")],
];

for (const [from, to] of copies) {
  if (!fs.existsSync(from)) {
    console.warn(`[deploy] Skip missing path: ${from}`);
    continue;
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true });
  console.log(`[deploy] Copied ${path.basename(from)} -> ${to}`);
}

console.log("[deploy] Standalone bundle ready.");
