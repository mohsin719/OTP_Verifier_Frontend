import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "out");
const nextDir = path.join(root, ".next");

console.log("[deploy] cwd:", root);
console.log("[deploy] exists out/:", fs.existsSync(outDir));
console.log("[deploy] exists .next/:", fs.existsSync(nextDir));

if (!fs.existsSync(outDir)) {
  console.error(
    "[deploy] out/ folder missing after next build.",
  );
  console.error(
    "[deploy] Hostinger Next.js preset may ignore output:export.",
  );
  console.error(
    "[deploy] Fix: set Framework to Other, Output directory to out, Build to npm run build.",
  );
  process.exit(1);
}

const htaccessSource = path.join(root, "public", ".htaccess");
const htaccessTarget = path.join(outDir, ".htaccess");

if (fs.existsSync(htaccessSource)) {
  fs.copyFileSync(htaccessSource, htaccessTarget);
  console.log("[deploy] Copied public/.htaccess -> out/.htaccess");
} else {
  console.warn("[deploy] public/.htaccess missing; routing may fail on refresh.");
}

const fileCount = fs.readdirSync(outDir).length;
console.log(`[deploy] out/ ready (${fileCount} top-level entries)`);
