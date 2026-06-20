/**
 * Browser E2E: login → reload login page → should redirect to dashboard.
 * Run: npx playwright install chromium && node scripts/test-session-browser.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.FRONTEND_URL ?? 'http://localhost:3000';
const EMAIL = process.env.TEST_LOGIN_EMAIL;
const PASSWORD = process.env.TEST_LOGIN_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error(
    'Set TEST_LOGIN_EMAIL and TEST_LOGIN_PASSWORD env vars before running.',
  );
  process.exit(1);
}

function log(ok, msg) {
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${msg}`);
  if (!ok) process.exitCode = 1;
}

async function main() {
  console.log('\n=== Browser Session Test (Playwright) ===\n');

  const browser = await chromium.launch({
    headless: true,
    channel: 'msedge',
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.fill('input[type="email"], input[name="email"]', EMAIL);
    await page.fill('input[type="password"], input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/dashboard/, { timeout: 30000 });
    log(true, 'Login redirects to /dashboard');

    const storage = await page.evaluate(() => localStorage.getItem('vsms-auth'));
    const hasToken = Boolean(storage && storage.includes('token'));
    log(hasToken, 'localStorage vsms-auth has token after login');

    // Simulate user leaving and coming back to login page
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForURL(/\/dashboard/, { timeout: 30000 });
    log(true, 'Revisit /login auto-redirects to /dashboard (no re-login)');

    // Simulate fresh tab with same browser profile (same context = same cookies/storage)
    const page2 = await context.newPage();
    await page2.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page2.waitForURL(/\/dashboard/, { timeout: 30000 });
    log(true, 'New tab /login also auto-redirects to /dashboard');

    await page2.goto(`${BASE}/register`, { waitUntil: 'networkidle', timeout: 30000 });
    await page2.waitForURL(/\/dashboard/, { timeout: 30000 });
    log(true, '/register redirects to /dashboard when already logged in');
  } catch (e) {
    log(false, e instanceof Error ? e.message : String(e));
  } finally {
    await browser.close();
  }

  console.log(
    process.exitCode
      ? '\nBrowser test FAILED.\n'
      : '\nBrowser test PASSED — auto-login works locally.\n',
  );
}

void main();
