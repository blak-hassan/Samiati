// .lighthouserc.cjs
// Lighthouse CI configuration. Opt-in via the `perf:lhci` PR label until the
// first green baseline is captured — see docs/perf.md §6 and
// .github/workflows/ci.yml (lighthouse job).
//
// To run locally:
//   1. npm run build
//   2. npm start &  (serves on :3000)
//   3. npx @lhci/cli@0.13.x autorun

module.exports = {
  ci: {
    collect: {
      // Static URL mode is the simplest path; start `next start` before
      // invoking LHCI. Add the routes you want to assert on below.
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/feed',
        'http://localhost:3000/profile',
        'http://localhost:3000/post/sample',
      ],
      numberOfRuns: 3,
      settings: {
        // Emulate a mid-tier mobile device.
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 412,
          height: 823,
          deviceScaleFactor: 1.75,
          disabled: false,
        },
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
      },
    },
    assert: {
      // Hard-fail budgets. Read from perf-budget.json when stable; these
      // defaults mirror the values in perf-budget.json:webVitals.
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        interactive: ['error', { maxNumericValue: 200 }], // INP proxy
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
      },
    },
    upload: {
      // Optional: set LHCI_TOKEN and target for Lighthouse Server.
      target: 'temporary-public-storage',
    },
  },
};
