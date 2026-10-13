const assert = require("node:assert/strict");
const {readdirSync,readFileSync} = require("node:fs");
const styles = readdirSync("dist/assets").filter(name=>name.endsWith(".css")).map(name=>readFileSync("dist/assets/"+name,"utf8")).join("\n");
const invertRules = [...styles.matchAll(/([^{}]+)\{([^{}]*filter\s*:\s*invert\(1\)[^{}]*)\}/g)].map(match=>match[1].trim());
for(const selector of invertRules) {
  assert.ok(!/^(?:html|body)(?:\[[^\]]*\])?$/i.test(selector),"whole-page inversion must never be emitted: "+selector);
}
assert.ok(!styles.includes('.board-meta img{'),"board source metadata no longer reserves platform image space");
assert.ok(invertRules.some(selector=>selector.includes(".event-source-line")&&selector.includes("img")),"reading source adjustment must target its image");
console.log("AI_STYLE_OUTPUT_OK: text-only board metadata and targeted reading image contrast; no whole-page inversion");
