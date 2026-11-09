/**
 * Generates `convex/_generated` from the schema, offline.
 *
 * `npx convex codegen` needs a deployment, so it cannot run in CI or on a
 * fresh clone — which meant the Convex backend was never typechecked. A
 * duplicate import in `convex/discover.ts` shipped for exactly that reason.
 *
 * The templates the Convex CLI uses ship with the `convex` package, so the
 * same files can be produced here from the same source: `server.ts`,
 * `dataModel.ts` and `api.ts`, exactly as `npx convex dev` writes them.
 *
 * The output is git-ignored. This script regenerates it whenever it is
 * needed.
 */
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const convexDir = join(root, "convex");
const generatedDir = join(convexDir, "_generated");
const templates = join(
  root,
  "node_modules",
  "convex",
  "dist",
  "esm",
  "cli",
  "codegen_templates",
);

if (!existsSync(join(templates, "server.js"))) {
  throw new Error(
    `Could not find the Convex codegen templates in ${templates}. The convex package moved them; update this script.`,
  );
}

const { serverCodegen } = await import(
  pathToFileURL(join(templates, "server.js")).href
);
const { apiCodegen } = await import(
  pathToFileURL(join(templates, "api.js")).href
);
const { header } = await import(
  pathToFileURL(join(templates, "common.js")).href
);
/**
 * The data model template.
 *
 * `dataModel.js` cannot be imported: it reaches into the CLI, which needs
 * packages the library does not depend on. Its template is a single literal
 * with one interpolation, so it is read out of the source and evaluated with
 * the same `header()` the CLI uses.
 */
async function dataModelTemplate() {
  const source = await readFile(join(templates, "dataModel.js"), "utf8");
  const marker = "const dynamicDataModelContent = `";
  const start = source.indexOf(marker);

  if (start === -1) {
    throw new Error("Could not find the data model template in dataModel.js.");
  }

  const from = start + marker.length;
  const end = source.indexOf("`;", from);
  const literal = source.slice(from, end);

  // The template is static apart from `header(...)`, so evaluating it with
  // that one binding reproduces exactly what the CLI writes.
  // eslint-disable-next-line no-new-func
  return new Function("header", `return \`${literal}\`;`)(header);
}

const ENTRY_POINT_EXTENSIONS = [
  ".js",
  ".ts",
  ".tsx",
  ".jsx",
  ".mjs",
  ".cjs",
  ".mts",
  ".cts",
];

async function walk(dir) {
  const files = [];

  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (["_generated", "_deps", "node_modules"].includes(entry.name)) {
        continue;
      }
      files.push(...(await walk(full)));
      continue;
    }

    files.push(full);
  }

  return files;
}

/**
 * The modules Convex treats as entry points.
 *
 * The rules are the CLI's own: the schema is not an entry point, the
 * generated directory is skipped, and a TypeScript file without an import or
 * an export is not a module.
 */
async function entryPoints() {
  const points = [];

  for (const file of await walk(convexDir)) {
    const rel = relative(convexDir, file);
    const base = file.slice(file.lastIndexOf(sep) + 1);

    if (!ENTRY_POINT_EXTENSIONS.some((ext) => rel.endsWith(ext))) continue;
    if (rel.startsWith(`_generated${sep}`)) continue;
    if (base.startsWith(".") || base.startsWith("#")) continue;
    if (base === "schema.ts" || base === "schema.js") continue;
    if ((base.match(/\./g) || []).length > 1) continue;
    if (rel.includes(" ")) continue;

    if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      const source = await readFile(file, "utf8");
      if (!/^\s{0,100}(import|export)/m.test(source)) continue;
    }

    points.push(rel.split(sep).join("/"));
  }

  return points.sort();
}

const modules = await entryPoints();

await mkdir(generatedDir, { recursive: true });

const server = serverCodegen({ useTypeScript: true, envVars: undefined });
await writeFile(join(generatedDir, "server.ts"), server.TS, "utf8");
await writeFile(
  join(generatedDir, "dataModel.ts"),
  await dataModelTemplate(),
  "utf8",
);

const api = apiCodegen(modules, { useTypeScript: true });
await writeFile(join(generatedDir, "api.ts"), api.TS, "utf8");

console.log(
  `Generated convex/_generated for ${modules.length} modules: ${modules.join(", ")}`,
);
