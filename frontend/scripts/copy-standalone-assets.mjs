import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const standaloneRoot = path.join(root, ".next", "standalone", "frontend");
const staticSource = path.join(root, ".next", "static");
const staticTarget = path.join(standaloneRoot, ".next", "static");
const publicSource = path.join(root, "public");
const publicTarget = path.join(standaloneRoot, "public");
const serverEntry = path.join(standaloneRoot, "server.js");

function copyIfExists(from, to, label) {
  if (!fs.existsSync(from)) {
    console.error(`[deploy] MISSING: ${label} not found at ${from}`);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true });
  console.log(`[deploy] Copied ${label} -> ${to}`);
}

if (!fs.existsSync(serverEntry)) {
  console.error(`[deploy] Standalone server missing: ${serverEntry}`);
  console.error("[deploy] Run `npm run build` from the frontend folder first.");
  process.exit(1);
}

copyIfExists(publicSource, publicTarget, "public");
copyIfExists(staticSource, staticTarget, ".next/static");

const staticFiles = fs.readdirSync(staticTarget, { recursive: true });
if (staticFiles.length === 0) {
  console.error("[deploy] .next/static is empty after copy.");
  process.exit(1);
}

console.log(
  `[deploy] Standalone bundle ready. Start with: node .next/standalone/frontend/server.js`,
);
