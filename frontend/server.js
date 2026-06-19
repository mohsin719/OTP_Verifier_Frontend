/**
 * Hostinger Node.js entry file.
 * hPanel → Application startup file: server.js
 */
const { existsSync } = require("fs");
const { execSync } = require("child_process");
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

if (!existsSync(".next/BUILD_ID")) {
  console.log("[server] .next missing — running build...");
  execSync("npm run build", { stdio: "inherit" });
}

const port = Number(process.env.PORT || 3000);
const hostname = process.env.HOSTNAME || "0.0.0.0";
const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    }).listen(port, hostname, () => {
      console.log(`VerifySMS frontend ready on http://${hostname}:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start Next.js:", err);
    process.exit(1);
  });
