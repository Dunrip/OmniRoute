import test from "node:test";
import assert from "node:assert/strict";

import { REGISTRY } from "../../open-sse/config/providerRegistry.ts";

test("Model specs accuracy: context_length and max_output_tokens for active models", async (t) => {
  // Test 1: cx/gpt-5.4 has context_length: 1050000
  await t.test("cx/gpt-5.4 has context_length: 1050000", () => {
    const codexRegistry = REGISTRY.codex;
    const model = codexRegistry.models.find((m) => m.id === "gpt-5.4");
    assert.ok(model, "gpt-5.4 model not found in codex registry");
    assert.equal(model.contextLength, 1050000, "gpt-5.4 context_length incorrect");
  });

  // Test 2: cx/gpt-5.4 has max_output_tokens: 128000
  await t.test("cx/gpt-5.4 has max_output_tokens: 128000", () => {
    const codexRegistry = REGISTRY.codex;
    const model = codexRegistry.models.find((m) => m.id === "gpt-5.4");
    assert.ok(model, "gpt-5.4 model not found in codex registry");
    // gpt-5.4 should inherit provider default max_output_tokens since not explicitly set
    assert.equal(
      model.maxOutputTokens ?? codexRegistry.defaultMaxOutputTokens,
      128000,
      "gpt-5.4 max_output_tokens incorrect"
    );
  });

  // Test 3: cx/gpt-5.4-mini has context_length: 400000 (inherits provider default)
  await t.test("cx/gpt-5.4-mini has context_length: 400000 (provider default)", () => {
    const codexRegistry = REGISTRY.codex;
    const model = codexRegistry.models.find((m) => m.id === "gpt-5.4-mini");
    assert.ok(model, "gpt-5.4-mini model not found in codex registry");
    assert.equal(
      model.contextLength ?? codexRegistry.defaultContextLength,
      400000,
      "gpt-5.4-mini context_length incorrect"
    );
  });

  // Test 4: cc/claude-opus-4-6 has context_length: 1000000
  await t.test("cc/claude-opus-4-6 has context_length: 1000000", () => {
    const claudeRegistry = REGISTRY.claude;
    const model = claudeRegistry.models.find((m) => m.id === "claude-opus-4-6");
    assert.ok(model, "claude-opus-4-6 model not found in claude registry");
    assert.equal(model.contextLength, 1000000, "claude-opus-4-6 context_length incorrect");
  });

  // Test 5: cc/claude-opus-4-6 has max_output_tokens: 128000
  await t.test("cc/claude-opus-4-6 has max_output_tokens: 128000", () => {
    const claudeRegistry = REGISTRY.claude;
    const model = claudeRegistry.models.find((m) => m.id === "claude-opus-4-6");
    assert.ok(model, "claude-opus-4-6 model not found in claude registry");
    assert.equal(model.maxOutputTokens, 128000, "claude-opus-4-6 max_output_tokens incorrect");
  });

  // Test 6: kmc/kimi-k2.5 has context_length: 256000
  await t.test("kmc/kimi-k2.5 has context_length: 256000", () => {
    const kimiRegistry = REGISTRY["kimi-coding"];
    const model = kimiRegistry.models.find((m) => m.id === "kimi-k2.5");
    assert.ok(model, "kimi-k2.5 model not found in kimi-coding registry");
    assert.equal(
      model.contextLength ?? kimiRegistry.defaultContextLength,
      256000,
      "kimi-k2.5 context_length incorrect"
    );
  });

  // Test 7: kmc/kimi-k2.5 has max_output_tokens: 32768
  await t.test("kmc/kimi-k2.5 has max_output_tokens: 32768", () => {
    const kimiRegistry = REGISTRY["kimi-coding"];
    const model = kimiRegistry.models.find((m) => m.id === "kimi-k2.5");
    assert.ok(model, "kimi-k2.5 model not found in kimi-coding registry");
    assert.equal(
      model.maxOutputTokens ?? kimiRegistry.defaultMaxOutputTokens,
      32768,
      "kimi-k2.5 max_output_tokens incorrect"
    );
  });

  // Test 8: A non-overridden model still uses provider default context
  await t.test("A non-overridden model uses provider default context", () => {
    const claudeRegistry = REGISTRY.claude;
    const model = claudeRegistry.models.find((m) => m.id === "claude-opus-4-5-20251101");
    assert.ok(model, "claude-opus-4-5-20251101 not found");
    // This model has no contextLength override, so it should fall back to provider default
    assert.equal(
      model.contextLength ?? claudeRegistry.defaultContextLength,
      200000,
      "non-overridden model should inherit provider default context"
    );
  });

  // Test 9: A model without configured output tokens omits maxOutputTokens
  await t.test("A model without configured output tokens omits maxOutputTokens", () => {
    const claudeRegistry = REGISTRY.claude;
    const model = claudeRegistry.models.find((m) => m.id === "claude-opus-4-5-20251101");
    assert.ok(model, "claude-opus-4-5-20251101 not found");
    // This model does not have maxOutputTokens set
    assert.equal(
      model.maxOutputTokens,
      undefined,
      "model without maxOutputTokens should be undefined (not set)"
    );
  });
});
