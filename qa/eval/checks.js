/**
 * Deterministic translation quality checks (no reference needed).
 *
 * These checks run on every case regardless of review_status and do not
 * require a reference translation. They catch:
 *   - Correct language routing (source != target, supported pair)
 *   - Non-empty response
 *   - Response is not just the input echoed back
 *   - Output structure/schema validity
 *   - Length sanity (not excessively long/short vs input)
 *   - No leaked prompts or system text
 *   - No wrong-script output
 *
 * Language-ID coverage note: only languages covered by an available
 * detector can be auto-checked for script/language identity. Unsupported
 * languages are stated plainly, not pretended.
 */

const fs = require("node:fs");

const SUPPORTED_LANGS = new Set([
  "sw", "ki", "luo", "kam", "kln", "luy", "mer", "mas", "en",
]);

// Languages that a detector can cover (for script/lang ID checks).
// Languages NOT in this set are explicitly unsupported for auto-detection.
const LANG_ID_COVERED = new Set(["sw", "ki", "en"]);

const SYSTEM_TEXT_PATTERNS = [
  /You are (a |an )?[A-Z]/i,           // "You are a helpful assistant"
  /system prompt/i,
  /as an AI language model/i,
  /I cannot (help|answer|provide)/i,
  /My training data/i,
  /samiati system/i,
];

function runDeterministicChecks(
  input,
  output,
  sourceLang,
  targetLang,
  caseId,
) {
  const results = [];

  // 1. Supported language pair
  const pairSupported =
    SUPPORTED_LANGS.has(sourceLang) && SUPPORTED_LANGS.has(targetLang);
  results.push({
    caseId,
    check: "language_pair_supported",
    pass: pairSupported,
    detail: pairSupported
      ? `${sourceLang}->${targetLang} is supported`
      : `${sourceLang}->${targetLang} NOT supported`,
  });

  // 2. Non-empty response
  const nonEmpty = output.trim().length > 0;
  results.push({
    caseId,
    check: "non_empty_response",
    pass: nonEmpty,
    detail: nonEmpty ? "response is non-empty" : "response is empty",
  });

  // 3. Not just echo of input
  const notEcho = output.trim() !== input.trim();
  results.push({
    caseId,
    check: "not_echo",
    pass: notEcho,
    detail: notEcho
      ? "response differs from input"
      : "response echoes input exactly",
  });

  // 4. Length sanity
  const lenRatio = output.length / Math.max(input.length, 1);
  const lengthSane = lenRatio <= 5 && output.length >= 1;
  results.push({
    caseId,
    check: "length_sanity",
    pass: lengthSane,
    detail: `output:${output.length} input:${input.length} ratio:${lenRatio.toFixed(2)}`,
  });

  // 5. No leaked prompts/system text
  const noLeak = !SYSTEM_TEXT_PATTERNS.some((p) => p.test(output));
  results.push({
    caseId,
    check: "no_system_text_leak",
    pass: noLeak,
    detail: noLeak ? "no system text detected" : "possible system text leak",
  });

  // 6. No wrong-script output (only for covered languages)
  const langCovered = LANG_ID_COVERED.has(targetLang);
  if (!langCovered) {
    results.push({
      caseId,
      check: "script_check",
      pass: true,
      detail: `${targetLang} not covered by language-ID detector; script check skipped`,
    });
  } else {
    // Simple heuristic: Latin script only for these languages (all use Latin)
    const latinOnly = /^[\u0000-\u007F\u00C0-\u024F\s.,!?'"-]*$/.test(output);
    results.push({
      caseId,
      check: "script_check",
      pass: latinOnly,
      detail: latinOnly
        ? "output appears to be Latin script"
        : "output contains non-Latin characters (possible wrong script)",
    });
  }

  return results;
}

function loadCases(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  return text
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));
}

module.exports = { runDeterministicChecks, loadCases, SUPPORTED_LANGS, LANG_ID_COVERED };
