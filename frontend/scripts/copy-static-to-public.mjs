import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const staticSource = path.join(root, ".next", "static");
const staticTarget = path.join(root, "public", "_next", "static");

if (!fs.existsSync(staticSource)) {
  console.error("[deploy] .next/static missing. Run `npm run build` first.");
  process.exit(1);
}

fs.rmSync(path.join(root, "public", "_next"), { recursive: true, force: true });
fs.mkdirSync(staticTarget, { recursive: true });
fs.cpSync(staticSource, staticTarget, { recursive: true });

const files = fs.readdirSync(staticTarget, { recursive: true });
console.log(
  `[deploy] Copied .next/static -> public/_next/static (${files.length} files)`,
);
