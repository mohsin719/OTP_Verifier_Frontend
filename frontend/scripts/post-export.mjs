import fs from "node:fs";
import path from "node:path";

const outDir = path.join(process.cwd(), "out");

if (!fs.existsSync(outDir)) {
  console.error("[deploy] out/ folder missing. Run next build with output export first.");
  process.exit(1);
}

const htaccess = `RewriteEngine On
RewriteBase /

# Serve real files (CSS, JS, images)
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# /path -> /path.html (Next.js static export)
RewriteCond %{REQUEST_URI} !\\.html$
RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI}.html -f
RewriteRule ^(.+)$ $1.html [L]

# /path/ -> /path/index.html
RewriteCond %{REQUEST_URI} !/$
RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI}/index.html -f
RewriteRule ^(.+)$ $1/index.html [L]

# Fallback
RewriteRule ^ index.html [L]
`;

fs.writeFileSync(path.join(outDir, ".htaccess"), htaccess, "utf8");
console.log("[deploy] Wrote out/.htaccess for Hostinger Apache routing");
