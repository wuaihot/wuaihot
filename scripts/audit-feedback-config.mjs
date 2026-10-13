import assert from "node:assert/strict";
import { FEEDBACK_PROVIDERS, resolveFeedbackConfig } from "../src/config/feedback.mjs";

assert.deepEqual([...FEEDBACK_PROVIDERS], ["off", "github", "url"]);

const disabled = resolveFeedbackConfig({});
assert.equal(disabled.provider, "off");
assert.equal(disabled.enabled, false);
assert.equal(disabled.url, "");
assert.equal(disabled.portalUrl, "");

const github = resolveFeedbackConfig({
  VITE_FEEDBACK_PROVIDER: "github",
  VITE_FEEDBACK_URL: "https://github.com/wuaihot/wuaihot/issues",
});
assert.equal(github.provider, "github");
assert.equal(github.enabled, true);
assert.equal(github.portalUrl, "https://github.com/wuaihot/wuaihot/issues");

const customUrl = resolveFeedbackConfig({
  VITE_FEEDBACK_PROVIDER: "url",
  VITE_FEEDBACK_URL: "https://example.com/feedback?from=dailyhot",
});
assert.equal(customUrl.provider, "url");
assert.equal(customUrl.enabled, true);
assert.equal(customUrl.portalUrl, "https://example.com/feedback?from=dailyhot");

const unsafeUrl = resolveFeedbackConfig({
  VITE_FEEDBACK_PROVIDER: "url",
  VITE_FEEDBACK_URL: "javascript:alert(1)",
});
assert.equal(unsafeUrl.provider, "off");
assert.equal(unsafeUrl.enabled, false);

const unsupportedLegacyProvider = resolveFeedbackConfig({
  VITE_FEEDBACK_PROVIDER: "quackback",
  VITE_FEEDBACK_URL: "https://example.com/",
});
assert.equal(unsupportedLegacyProvider.provider, "off");
assert.equal(unsupportedLegacyProvider.enabled, false);
assert.equal(unsupportedLegacyProvider.portalUrl, "");

const invalidProvider = resolveFeedbackConfig({
  VITE_FEEDBACK_PROVIDER: "invalid",
  VITE_FEEDBACK_URL: "https://example.com",
});
assert.equal(invalidProvider.provider, "off");
assert.equal(invalidProvider.enabled, false);

const missingUrl = resolveFeedbackConfig({ VITE_FEEDBACK_PROVIDER: "github" });
assert.equal(missingUrl.provider, "off");
assert.equal(missingUrl.enabled, false);

console.log("[feedback] external-only configuration audit passed");
