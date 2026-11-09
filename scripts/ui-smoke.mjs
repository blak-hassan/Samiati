// Read-only route compilation check. Start the app separately, then run:
// node scripts/ui-smoke.mjs http://localhost:3100
const origin = process.argv[2] ?? "http://localhost:3100";
const paths = ["/", "/languages", "/onboarding", "/pricing", "/dashboard", "/dashboard/discover", "/dashboard/changa", "/dashboard/profile", "/dashboard/settings/appearance", "/dashboard/add-contribution", "/dashboard/validate"];
const results = await Promise.all(paths.map(async (path) => {
  try {
    const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(55000), redirect: "manual" });
    const html = await response.text();
    return { path, status: response.status, applicationError: html.includes("data-next-error-message") || html.includes('id="__next_error__"') };
  } catch (error) {
    return { path, error: error.message };
  }
}));
for (const result of results) console.log(JSON.stringify(result));
if (results.some((result) => result.status !== 200 || result.applicationError)) process.exitCode = 1;
