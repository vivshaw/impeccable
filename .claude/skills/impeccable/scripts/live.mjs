/**
 * CLI entry point: prepare everything needed to enter the live variant poll loop.
 *
 * Does (all in one command):
 *   1. Check config.json (returns config_missing if first-ever run)
 *   2. Start the live server in the background (or reuse a running one)
 *   3. Inject the browser script tag into the project's entry file
 *   4. Read .impeccable.md for design context (if present)
 *   5. Print a single JSON blob with everything the agent needs
 *
 * After this, the agent's only remaining steps are:
 *   - Navigate the browser to the page (optional, if browser automation is available)
 *   - Enter the poll loop: `node live-poll.mjs`
 *
 * Usage:
 *   node live.mjs                   # Prepare everything, print JSON, exit
 *   node live.mjs --help
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PID_FILE = path.join(process.cwd(), '.impeccable-live.json');
const CONTEXT_FILE = path.join(process.cwd(), '.impeccable.md');

async function liveCli() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`Usage: node live.mjs

Prepare everything for live variant mode in a single command:
  - Checks scripts/config.json (required, created once per project)
  - Starts (or reuses) the live server in the background
  - Injects the browser script tag
  - Reads .impeccable.md for design context

On success, prints a JSON blob with:
  { ok, serverPort, serverToken, pageFile, hasContext, context }

On config_missing, prints:
  { ok: false, error: "config_missing", configPath, hint }

The agent should then:
  1. If config_missing, create the config and re-run this script
  2. Optionally navigate the browser to the page
  3. Enter the poll loop: node live-poll.mjs`);
    process.exit(0);
  }

  // 1. Check config (fail fast if missing — no point starting anything else)
  const checkOut = runScript('live-inject.mjs', ['--check']);
  const checkResult = safeParse(checkOut);
  if (!checkResult || !checkResult.ok) {
    console.log(JSON.stringify(checkResult || { ok: false, error: 'check_failed', raw: checkOut }));
    process.exit(0);
  }

  // 2. Start server (or reuse existing)
  const serverInfo = ensureServerRunning();
  if (!serverInfo) {
    console.log(JSON.stringify({ ok: false, error: 'server_start_failed' }));
    process.exit(1);
  }

  // 3. Inject the script tag at the current port
  const injectOut = runScript('live-inject.mjs', ['--port', String(serverInfo.port)]);
  const injectResult = safeParse(injectOut);
  if (!injectResult || !injectResult.ok) {
    console.log(JSON.stringify({
      ok: false,
      error: 'inject_failed',
      detail: injectResult || injectOut,
      serverPort: serverInfo.port,
    }));
    process.exit(1);
  }

  // 4. Load design context if available
  let context = null;
  try { context = fs.readFileSync(CONTEXT_FILE, 'utf-8'); } catch { /* optional */ }

  // 5. Emit everything the agent needs
  console.log(JSON.stringify({
    ok: true,
    serverPort: serverInfo.port,
    serverToken: serverInfo.token,
    pageFile: checkResult.config.file,
    hasContext: !!context,
    context,
  }, null, 2));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function runScript(name, args) {
  const scriptPath = path.join(__dirname, name);
  const cmd = `node "${scriptPath}" ${args.map(a => `"${a}"`).join(' ')}`;
  try {
    return execSync(cmd, { encoding: 'utf-8', cwd: process.cwd(), timeout: 15_000 });
  } catch (err) {
    // execSync throws on non-zero exit; return stdout if any
    return err.stdout || err.message || '';
  }
}

function safeParse(out) {
  try { return JSON.parse(String(out).trim()); } catch { return null; }
}

/**
 * Return { pid, port, token } for the running live server, starting one if needed.
 */
function ensureServerRunning() {
  // Try to reuse an existing server
  try {
    const existing = JSON.parse(fs.readFileSync(PID_FILE, 'utf-8'));
    if (existing && existing.pid) {
      try {
        process.kill(existing.pid, 0); // throws if dead
        return existing;
      } catch { /* stale PID file — the server script will clean it up */ }
    }
  } catch { /* no PID file */ }

  // Start a new server
  const out = runScript('live-server.mjs', ['--background']);
  return safeParse(out);
}

// ---------------------------------------------------------------------------
// Auto-execute
// ---------------------------------------------------------------------------

const _running = process.argv[1];
if (_running?.endsWith('live.mjs') || _running?.endsWith('live.mjs/')) {
  liveCli();
}
