import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const standaloneRoot = path.join(root, ".next", "standalone", "frontend");

function copyIfExists(from, to) {
  if (!fs.existsSync(from)) {
    return;
  }

  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true });
}

copyIfExists(path.join(root, "public"), path.join(standaloneRoot, "public"));
copyIfExists(
  path.join(root, ".next", "static"),
  path.join(standaloneRoot, ".next", "static"),
);
