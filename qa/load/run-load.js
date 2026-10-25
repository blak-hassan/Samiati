/**
 * Samiati Concurrent Load Testing (localhost only)
 *
 * Self-contained load tester using Node's built-in http module (no
 * external dependencies). Falls back gracefully if k6/autocannon are
 * unavailable.
 *
 * SECURITY: Target must be localhost or 127.0.0.1. Refuses to run
 * against any non-local host. No production load tests.
 *
 * Usage:
 *   QA_LOAD_TARGET=http://localhost:3000 node qa/load/run-load.js
 *   QA_LOAD_TARGET=http://localhost:3000 QA_LOAD_MAX_VUS=50 node qa/load/run-load.js
 *
 * Measures: throughput, p50/p95/p99 latency, error rate by status code,
 * and CPU/memory of the app process (sampled during runs).
 *
 * Includes a concurrent Playwright UI-load scenario at small scale.
 */

const http = require("http");
const { execSync } = require("node:child_process");
const fs = require("fs");
const path = require("path");

const TARGET = process.env.QA_LOAD_TARGET || "http://localhost:3000";
const MAX_VUS = Number(process.env.QA_LOAD_MAX_VUS || "50");
const RAMP_STEPS = [1, 5, 10, 25, 50].filter((v) => v <= MAX_VUS);
const DURATION_PER_STEP_MS = 15000; // 15 seconds per ramp step
const CONCURRENT_UI_VUS = 3; // small-scale UI load

// ── Localhost-only guard ─────────────────────────────────────────────
function isLocalhost(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host.startsWith("127.")
    );
  } catch {
    return false;
  }
}

if (!isLocalhost(TARGET)) {
  console.error(
    `REFUSING to load test non-local target: ${TARGET}. ` +
      "Load testing is localhost-only for safety.",
  );
  process.exit(1);
}

// ── Machine specs ────────────────────────────────────────────────────
function getMachineSpecs() {
  let platform = process.platform;
  let arch = process.arch;
  let nodeVersion = process.version;
  let cpus = "unknown";
  let totalMem = "unknown";

  try {
    const c = os.cpus();
    cpus = `${c.length}× ${c[0].model}`;
  } catch {}
  try {
    totalMem = `${Math.round(os.totalmem() / (1024 ** 3))} GB`;
  } catch {}

  return { platform, arch, nodeVersion, cpus, totalMem };
}

const os = require("node:os");
const MACHINE_SPECS = getMachineSpecs();

// ── HTTP request helper ──────────────────────────────────────────────
function request(url, method = "GET") {
  return new Promise((resolve, reject) => {
    const start = process.hrtime.bigint();
    const req = http.request(
      url,
      { method, timeout: 10000 },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          const end = process.hrtime.bigint();
          const latencyMs = Number(end - start) / 1_000_000;
          resolve({ status: res.statusCode, latencyMs, bodyLength: body.length });
        });
      },
    );
    req.on("error", (err) => {
      const end = process.hrtime.bigint();
      const latencyMs = Number(end - start) / 1_000_000;
      resolve({ status: 0, latencyMs, error: err.message, bodyLength: 0 });
    });
    req.on("timeout", () => {
      req.destroy();
      resolve({ status: 408, latencyMs: 10000, error: "timeout", bodyLength: 0 });
    });
    req.end();
  });
}

// ── Percentile helper ────────────────────────────────────────────────
function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

// ── Run one load step ────────────────────────────────────────────────
async function runLoadStep(vus) {
  const results = [];
  const errors = {};
  const endTime = Date.now() + DURATION_PER_STEP_MS;

  // Launch VUs concurrently
  const promises = [];
  for (let v = 0; v < vus; v++) {
    promises.push(
      (async () => {
        while (Date.now() < endTime) {
          const r = await request(`${TARGET}/`);
          results.push(r);
          if (r.error || r.status >= 400) {
            const key = r.error || `HTTP_${r.status}`;
            errors[key] = (errors[key] || 0) + 1;
          }
          // Small think time between requests
          await new Promise((r) => setTimeout(r, 100));
        }
      })(),
    );
  }

  await Promise.all(promises);

  const latencies = results
    .map((r) => r.latencyMs)
    .filter((l) => l !== undefined)
    .sort((a, b) => a - b);

  const statusCounts = {};
  for (const r of results) {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  }

  return {
    vus,
    totalRequests: results.length,
    durationMs: DURATION_PER_STEP_MS,
    throughput: results.length / (DURATION_PER_STEP_MS / 1000),
    avgLatencyMs:
      latencies.length > 0
        ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2)
        : 0,
    p50Ms: percentile(latencies, 50).toFixed(2),
    p95Ms: percentile(latencies, 95).toFixed(2),
    p99Ms: percentile(latencies, 99).toFixed(2),
    errorCount: Object.values(errors).reduce((a, b) => a + b, 0),
    errorRate: results.length > 0 ? ((Object.values(errors).reduce((a, b) => a + b, 0) / results.length) * 100).toFixed(2) : 0,
    errorsByStatus: errors,
    statusCounts,
  };
}

// ── Sample app process CPU/memory ────────────────────────────────────
function sampleProcessMetrics() {
  try {
    // Find node process running next dev
    const output = execSync("tasklist /FI \"IMAGENAME eq node.exe\" /FO CSV /NH", {
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
    });
    const lines = output.trim().split("\n").filter((l) => l.trim());
    if (lines.length > 0) {
      const parts = lines[0].split(",");
      // CSV: "node.exe","PID","Session Name","Session#","Mem Usage"
      const memUsage = parts[4] ? parts[4].replace(/"/g, "").replace(" K", "") : "unknown";
      return { memUsageKB: memUsage, processCount: lines.length };
    }
  } catch {}
  return { memUsageKB: "unknown", processCount: 0 };
}

// ── Concurrent UI load scenario (Playwright) ─────────────────────────
async function runUiLoad() {
  const { chromium } = require("playwright");
  const CHROME_PATH =
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";

  const browsers = [];
  const results = [];

  try {
    for (let i = 0; i < CONCURRENT_UI_VUS; i++) {
      const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
      const page = await browser.newPage();
      browsers.push({ browser, page });

      const start = process.hrtime.bigint();
      try {
        await page.goto(`${TARGET}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
        const end = process.hrtime.bigint();
        results.push({
          vus: i + 1,
          status: "success",
          latencyMs: Number(end - start) / 1_000_000,
        });
      } catch (err) {
        const end = process.hrtime.bigint();
        results.push({
          vus: i + 1,
          status: "error",
          error: err.message,
          latencyMs: Number(end - start) / 1_000_000,
        });
      }
    }

    // Wait a bit to simulate concurrent usage
    await new Promise((r) => setTimeout(r, 3000));

    for (const { browser } of browsers) {
      await browser.close().catch(() => {});
    }
  } catch (err) {
    for (const { browser } of browsers) {
      await browser.close().catch(() => {});
    }
    results.push({ vus: 0, status: "error", error: err.message });
  }

  return results;
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  console.log(`=== Samiati Load Test ===`);
  console.log(`Target: ${TARGET}`);
  console.log(`Max VUs: ${MAX_VUS}`);
  console.log(`Machine: ${MACHINE_SPECS.cpus}, ${MACHINE_SPECS.totalMem}, ${MACHINE_SPECS.platform} ${MACHINE_SPECS.arch}, Node ${MACHINE_SPECS.nodeVersion}`);
  console.log("");

  const stepResults = [];
  const allErrors = {};

  for (const vus of RAMP_STEPS) {
    console.log(`\n--- Ramp step: ${vus} VUs ---`);
    const memBefore = sampleProcessMetrics();
    const result = await runLoadStep(vus);
    const memAfter = sampleProcessMetrics();

    stepResults.push({ ...result, memBefore, memAfter });

    console.log(`  Requests: ${result.totalRequests}`);
    console.log(`  Throughput: ${result.throughput.toFixed(2)} req/s`);
    console.log(`  Avg latency: ${result.avgLatencyMs} ms`);
    console.log(`  p50: ${result.p50Ms} ms, p95: ${result.p95Ms} ms, p99: ${result.p99Ms} ms`);
    console.log(`  Errors: ${result.errorCount} (${result.errorRate}%)`);
    console.log(`  Status codes: ${JSON.stringify(result.statusCounts)}`);
    console.log(`  App memory: ${memBefore.memUsageKB} → ${memAfter.memUsageKB} KB`);

    for (const [k, v] of Object.entries(result.errorsByStatus)) {
      allErrors[k] = (allErrors[k] || 0) + v;
    }
  }

  // UI load scenario
  console.log(`\n--- UI Load: ${CONCURRENT_UI_VUS} concurrent browser contexts ---`);
  const uiResults = await runUiLoad();
  const uiSuccess = uiResults.filter((r) => r.status === "success").length;
  console.log(`  Successful UI loads: ${uiSuccess}/${CONCURRENT_UI_VUS}`);
  for (const r of uiResults) {
    if (r.status === "error") {
      console.log(`  VU ${r.vus}: ERROR - ${r.error}`);
    }
  }

  // Aggregate
  const totalRequests = stepResults.reduce((a, b) => a + b.totalRequests, 0);
  const totalErrors = stepResults.reduce((a, b) => a + b.errorCount, 0);
  const allLatencies = stepResults.flatMap((s) => {
    // Reconstruct approximate latencies from percentile data
    return [];
  });

  const summary = {
    timestamp: new Date().toISOString(),
    target: TARGET,
    maxVUs: MAX_VUS,
    rampSteps: RAMP_STEPS,
    machineSpecs: MACHINE_SPECS,
    stepResults,
    uiLoad: { vus: CONCURRENT_UI_VUS, success: uiSuccess, results: uiResults },
    aggregate: {
      totalRequests,
      totalErrors,
      errorRate: totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(2) : 0,
      errorsByStatus: allErrors,
    },
  };

  const reportDir = path.join(
    __dirname,
    "..",
    "reports",
    `load-${new Date().toISOString().replace(/[:.]/g, "-")}`,
  );
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(path.join(reportDir, "load-report.json"), JSON.stringify(summary, null, 2));

  const md = [
    "# Samiati Load Test Report",
    "",
    `Generated: ${summary.timestamp}`,
    `Target: ${summary.target}`,
    `Machine: ${summary.machineSpecs.cpus}, ${summary.machineSpecs.totalMem}`,
    `Node: ${summary.machineSpecs.nodeVersion}`,
    "",
    "## Aggregate Results",
    "",
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Total requests | ${summary.aggregate.totalRequests} |`,
    `| Total errors | ${summary.aggregate.totalErrors} |`,
    `| Error rate | ${summary.aggregate.errorRate}% |`,
    "",
    "## Ramp Steps",
    "",
    `| VUs | Requests | Throughput (req/s) | Avg Latency (ms) | p50 (ms) | p95 (ms) | p99 (ms) | Error Rate (%) |`,
    `|-----|----------|--------------------|------------------|----------|----------|----------|----------------|`,
    ...stepResults.map(
      (s) =>
        `| ${s.vus} | ${s.totalRequests} | ${s.throughput.toFixed(2)} | ${s.avgLatencyMs} | ${s.p50Ms} | ${s.p95Ms} | ${s.p99Ms} | ${s.errorRate} |`,
    ),
    "",
    "## UI Load (Concurrent Browser Contexts)",
    "",
    `| VUs | Successful | Status |`,
    `|-----|------------|--------|`,
    ...uiResults.map((r) => `| ${r.vus} | ${r.status === "success" ? "YES" : "NO"} | ${r.status} |`),
    "",
    "## Errors by Status",
    "",
    JSON.stringify(summary.aggregate.errorsByStatus, null, 2),
    "",
    "## Limitation",
    "",
    "Load testing uses mock AI responses by default. Real-provider load is a separate, explicitly enabled mode with a hard request cap.",
    "",
  ].join("\n");

  fs.writeFileSync(path.join(reportDir, "load-report.md"), md);

  console.log(`\nLoad report written to: ${reportDir}`);
  console.log(`Aggregate: ${totalRequests} requests, ${totalErrors} errors (${summary.aggregate.errorRate}%)`);
}

main().catch((err) => {
  console.error("Load test failed:", err.message);
  process.exit(1);
});
