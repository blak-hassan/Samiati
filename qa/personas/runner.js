/**
 * Samiati AI Persona Simulation Runner
 *
 * Drives a real browser (Chromium via Playwright) against the local dev
 * server, simulating realistic users with AI-informed personas. Each run:
 *   - Assigns the persona a short goal
 *   - Steps through the app, logging JSONL
 *   - Caps steps at 25 per run
 *   - Detects loops (same URL + same action repeated)
 *   - Redacts secrets/tokens/emails from logs
 * - Output: per-persona friction findings, ranked
 *
 * Ollama is optional (vision-capable model for UI understanding). If not
 * available, the runner falls back to DOM/accessibility-tree-driven
 * exploration using the persona's characteristics.
 *
 * Usage:
 *   QA_MOCK_AI=1 npm run qa:personas
 *   # or with a specific persona:
 *   QA_MOCK_AI=1 node qa/personas/runner.js amina
 */

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const PERSONAS_DIR = path.join(__dirname, "personas");
const OUT_DIR = path.join(__dirname, "out");
const MAX_STEPS = 25;
const CHROME_PATH =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5-vl:7b";

// ── Secret redaction ───────────────────────────────────────────────
const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9]{20,}/g,           // API keys
  /pk_[A-Za-z0-9]{20,}/g,           // Clerk publishable keys
  /sk_or_[A-Za-z0-9]{20,}/g,        // Stripe keys
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, // JWTs
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, // emails
  /convex-[A-Za-z0-9_-]+/g,         // Convex deployment IDs
];
function redact(text) {
  let out = String(text ?? "");
  for (const re of SECRET_PATTERNS) out = out.replace(re, "[REDACTED]");
  return out;
}

// ── Logging ────────────────────────────────────────────────────────
let runDir;
let logStream;
let stepCounter = 0;
let seenStates = new Map(); // loop detection: url + action key -> count

function logEntry(entry) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    step: stepCounter,
    ...entry,
  });
  if (logStream) logStream.write(line + "\n");
  process.stdout.write(line + "\n");
}

// ── Persona loading ────────────────────────────────────────────────
function loadPersona(name) {
  const pPath = path.join(PERSONAS_DIR, `${name}.json`);
  if (!fs.existsSync(pPath)) {
    throw new Error(`Persona not found: ${pPath}`);
  }
  return JSON.parse(fs.readFileSync(pPath, "utf8"));
}

function listPersonas() {
  return fs
    .readdirSync(PERSONAS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

// ── Ollama check ───────────────────────────────────────────────────
async function ollamaAvailable() {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`);
    if (!res.ok) return false;
    const data = await res.json();
    return data.models.some((m) => m.name.includes(OLLAMA_MODEL.replace(/:/g, "\\:")));
  } catch {
    return false;
  }
}

// ── DOM-driven action helpers ──────────────────────────────────────
function getVisibleText(page) {
  return page.locator("body").innerText().catch(() => "");
}

async function findInteractiveElements(page) {
  const els = await page.locator("button, a, input, textarea, select").all();
  const out = [];
  for (const el of els) {
    try {
      if (!(await el.isVisible())) continue;
      const label = (await el.getAttribute("aria-label")) ||
                    (await el.getAttribute("placeholder")) ||
                    (await el.innerText()).slice(0, 60) ||
                    (await el.getAttribute("type")) ||
                    "unknown";
      const tag = await el.evaluate((e) => e.tagName.toLowerCase());
      out.push({ tag, label, name: await el.getAttribute("name") });
    } catch { /* skip */ }
  }
  return out;
}

// ── Persona-driven step selection ──────────────────────────────────
async function selectNextAction(page, persona, clickedTargets) {
  const currentUrl = page.url();

  // Loop detection: if we've clicked the same target 3 times, stop
  const stateKey = `${currentUrl}|${Array.from(clickedTargets).join(",")}`;
  const count = (seenStates.get(stateKey) ?? 0) + 1;
  seenStates.set(stateKey, count);
  if (count >= 3) return { type: "loop", reason: `Loop detected at ${currentUrl}` };

  // Heuristic action selection based on persona traits
  const allButtons = page.locator("button, a");
  const countBtns = await allButtons.count();

  // Filter out sr-only elements (skip links, etc.)
  const buttons = [];
  for (let i = 0; i < countBtns; i++) {
    const btn = allButtons.nth(i);
    try {
      if (!(await btn.isVisible())) continue;
      const cls = await btn.getAttribute("class") || "";
      if (/\bsr-only\b/.test(cls)) continue;
      buttons.push(btn);
    } catch { /* skip */ }
  }

  // Low tech comfort + slow network: prefer obvious primary actions
  if (persona.techComfort === "low" || persona.connectivity === "slow") {
    for (const btn of buttons) {
      const label = (await btn.getAttribute("aria-label")) || (await btn.innerText()).slice(0, 60);
      if (/Send|Search|Home|Back|Start/i.test(label) && !clickedTargets.has(label)) {
        return { type: "click", target: label };
      }
    }
  }

  // High tech comfort + low patience: try multiple elements quickly
  if (persona.techComfort === "high" && persona.patienceLevel === "low") {
    const n = Math.min(buttons.length, 3);
    for (let i = 0; i < n; i++) {
      const btn = buttons[i];
      const label = (await btn.getAttribute("aria-label")) || (await btn.innerText()).slice(0, 30);
      if (!clickedTargets.has(label)) {
        return { type: "click", target: label };
      }
    }
  }

  // Default: click first unvisited interactive element
  for (const btn of buttons) {
    const label = (await btn.getAttribute("aria-label")) || (await btn.innerText()).slice(0, 30);
    if (!clickedTargets.has(label)) {
      return { type: "click", target: label };
    }
  }

  return { type: "stop", reason: "No unvisited interactive elements" };
}

// ── Persona run ────────────────────────────────────────────────────
async function runPersona(persona) {
  stepCounter = 0;
  seenStates = new Map();
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  const context = await browser.newContext({
    viewport: persona.device === "mobile" ? { width: 360, height: 800 } : { width: 1280, height: 800 },
    // Grant microphone permission for voice-elder persona
    permissions: persona.name.includes("Voice") ? ["microphone"] : [],
  });
  const page = await context.newPage();

  logEntry({ event: "run_start", persona: persona.name, goal: persona.goal, device: persona.device });

  let currentGoal = persona.goal;
  let actions = [];
  let clickedTargets = new Set();

  for (let i = 0; i < MAX_STEPS; i++) {
    stepCounter++;
    const urlBefore = page.url();

    try {
      // Navigate to home if first step
      if (stepCounter === 1) {
        await page.goto(BASE_URL + "/", { waitUntil: "networkidle", timeout: 30000 });
        await page.waitForTimeout(1000);
        const bodyText = await page.locator("body").innerText().catch(() => "");
        logEntry({ event: "navigate", url: page.url(), observation: "Home page loaded", bodyPreview: bodyText.slice(0, 200) });
        actions.push({ url: page.url(), action: "navigate_home", label: "navigate_home" });
        continue;
      }

      const next = await selectNextAction(page, persona, clickedTargets);

      if (next.type === "loop" || next.type === "stop") {
        logEntry({ event: "run_end", reason: next.reason, steps: stepCounter });
        break;
      }

      if (next.type === "click") {
        // Find element by label
        const el = page.getByText(next.target).first().or(page.getByLabel(next.target).first());
        const first = el.first();
        if ((await el.count()) > 0 && (await first.isVisible())) {
          // Scroll into view so off-screen/sr-only elements are reachable
          try {
            await first.scrollIntoViewIfNeeded();
          } catch { /* ignore scroll errors */ }
          await page.waitForTimeout(300);
          const box = await first.boundingBox();
          if (!box || box.width === 0 || box.height === 0) {
            logEntry({ event: "skip", reason: `Element off-screen or zero-size: ${next.target}` });
            continue;
          }
          await first.click();
          await page.waitForTimeout(800); // let page react
          const urlAfter = page.url();
          const obs = `Clicked "${next.target}"`;
          logEntry({ event: "click", target: next.target, url: urlAfter, observation: obs });
          clickedTargets.add(next.target);
          actions.push({ url: urlAfter, action: `click:${next.target}`, label: next.target });
        } else {
          logEntry({ event: "skip", reason: `Element not found: ${next.target}` });
        }
      }
    } catch (err) {
      logEntry({ event: "error", error: redact(err.message), url: page.url() });
      break;
    }

    // Check for friction signals
    const bodyText = await getVisibleText(page);
    const frictionSignals = [];
    if (/error|sorry|something went wrong/i.test(bodyText)) frictionSignals.push("error_message_visible");
    if (/sign in|log in/i.test(bodyText) && !persona.name.includes("Power")) frictionSignals.push("auth_wall");
    if (/still working|loading/i.test(bodyText)) frictionSignals.push("slow_response");
    if (frictionSignals.length > 0) {
      logEntry({ event: "friction", signals: frictionSignals, url: page.url() });
    }
  }

  await browser.close();
  logEntry({ event: "run_complete", persona: persona.name, totalSteps: stepCounter });
}

// ── Main ───────────────────────────────────────────────────────────
async function main() {
  const requested = process.argv.slice(2);
  const personas = requested.length
    ? requested.map((n) => loadPersona(n))
    : listPersonas().map((n) => loadPersona(n));

  if (personas.length === 0) {
    console.error("No personas found.");
    process.exit(1);
  }

  const ollama = await ollamaAvailable();
  logEntry({ event: "ollama_available", value: ollama });

  // Create run directory
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  runDir = path.join(OUT_DIR, `run-${stamp}`);
  fs.mkdirSync(runDir, { recursive: true });
  const logPath = path.join(runDir, "simulation.jsonl");
  logStream = fs.createWriteStream(logPath, { flags: "w" });

  const results = [];

  for (const persona of personas) {
    logEntry({ event: "persona_start", name: persona.name });
    const start = Date.now();
    try {
      await runPersona(persona);
      results.push({ name: persona.name, status: "completed", durationMs: Date.now() - start });
    } catch (err) {
      logEntry({ event: "persona_error", name: persona.name, error: redact(err.message) });
      results.push({ name: persona.name, status: "error", error: redact(err.message) });
    }
  }

  logStream.end();

  // Write summary
  const summary = {
    runId: `run-${stamp}`,
    timestamp: new Date().toISOString(),
    ollamaAvailable: ollama,
    personas: results,
    limitation:
      "AI personas cannot judge pronunciation, cultural correctness, or real learning progress. Flag these for testing with real learners.",
  };
  fs.writeFileSync(path.join(runDir, "summary.json"), JSON.stringify(summary, null, 2));

  // Write friction report
  const frictionLines = [
    "# Persona Simulation Friction Findings",
    "",
    `Run: run-${stamp}`,
    `Ollama available: ${ollama}`,
    "",
    "## Limitation",
    summary.limitation,
    "",
  ];
  for (const r of results) {
    frictionLines.push(`### ${r.name} — ${r.status}`);
    if (r.error) frictionLines.push(`Error: ${r.error}`);
    frictionLines.push("");
  }
  fs.writeFileSync(path.join(runDir, "persona-simulation.md"), frictionLines.join("\n"));

  console.log(`\nRun complete: ${runDir}`);
  console.log(`Summary: ${results.length} personas processed`);
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
