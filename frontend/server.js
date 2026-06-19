/**
 * Hostinger startup file (set in hPanel).
 * Do NOT run build here — build runs in deploy step only.
 */
const { existsSync } = require("fs");
const path = require("path");

const standaloneServer = path.join(__dirname, ".next", "standalone", "server.js");

if (!existsSync(standaloneServer)) {
  console.error(
    "[server] .next/standalone/server.js not found. Deploy build step must run: npm run build",
  );
  process.exit(1);
}

process.env.HOSTNAME = process.env.HOSTNAME || "0.0.0.0";
process.env.PORT = process.env.PORT || "3000";

require(standaloneServer);
