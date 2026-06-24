import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const PRODUCTION_PUBLIC_ENV = {
  NEXT_PUBLIC_API_URL: "https://api.usnumhub.com/api",
  NEXT_PUBLIC_WS_URL: "https://api.usnumhub.com",
  NEXT_PUBLIC_SITE_URL: "https://usnumhub.com",
};

function loadDotEnv(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const vars = {};
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

const env = {
  ...process.env,
  ...loadDotEnv(".env.local"),
  ...PRODUCTION_PUBLIC_ENV,
};

console.log("[build:hostinger] Using production public URLs:");
for (const [key, value] of Object.entries(PRODUCTION_PUBLIC_ENV)) {
  console.log(`  ${key}=${value}`);
}

const nextBuild = spawnSync("npx", ["next", "build"], {
  env,
  stdio: "inherit",
  shell: true,
});
if (nextBuild.status !== 0) {
  process.exit(nextBuild.status ?? 1);
}

const postExport = spawnSync("node", ["scripts/post-export.mjs"], {
  env,
  stdio: "inherit",
});
if (postExport.status !== 0) {
  process.exit(postExport.status ?? 1);
}

const sitemapPath = new URL("../out/sitemap.xml", import.meta.url);
if (existsSync(sitemapPath)) {
  const sitemap = readFileSync(sitemapPath, "utf8");
  if (sitemap.includes("localhost")) {
    console.error(
      "[build:hostinger] sitemap.xml still contains localhost — check NEXT_PUBLIC_SITE_URL.",
    );
    process.exit(1);
  }
}

console.log("[build:hostinger] Production export ready in out/");
