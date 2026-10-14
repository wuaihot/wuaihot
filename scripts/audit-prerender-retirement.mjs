import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const read = (name) => readFileSync(new URL(name, root), "utf8");
const pkg = JSON.parse(read("package.json"));
const config = read("vite.config.js");
const lock = read("pnpm-lock.yaml");

assert.equal(pkg.devDependencies?.["vite-plugin-prerender"], undefined);
assert.equal(pkg.dependencies?.["vite-plugin-prerender"], undefined);
assert.ok(!lock.includes("vite-plugin-prerender@"), "legacy plugin remains in lockfile");
assert.ok(!config.includes("vite-plugin-prerender"), "legacy Vite import remains");
assert.ok(!config.includes("buildPrerenderRoutes"), "legacy route builder remains");
assert.match(config, /PRERENDER === "true"/);
assert.match(config, /throw new Error\("PRERENDER=true is no longer supported/);
assert.ok(existsSync(fileURLToPath(new URL("scripts/generate-route-shells.cjs", root))));

console.log("PRERENDER_RETIREMENT_OK: old plugin and lock graph absent; explicit guard and maintained SEO shell generator present");
