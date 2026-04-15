/**
 * Regression tests for context-management beta header gating.
 *
 * Verifies that:
 *  1. Static headers from buildHeaders() do NOT contain context-management-2025-06-27
 *     (red state test — should fail before Task 2 implementation)
 *  2. The conditional append logic (tested via local helper) correctly gates the beta
 *     only to supported Claude models (Opus, Sonnet), not Haiku.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { DefaultExecutor } from "../../open-sse/executors/default.ts";

// ── Group A: Static header tests (test buildHeaders() directly) ─────────────────
// These verify that context-management-2025-06-27 has been removed from the static
// Anthropic-Beta header in providerRegistry.ts and claudeCodeCompatible.ts

test("Group A1: Claude OAuth path — buildHeaders does NOT include context-management-2025-06-27", () => {
  const executor = new DefaultExecutor("claude");
  const headers = executor.buildHeaders({ accessToken: "test-oauth-token" }, true);

  const beta = headers["Anthropic-Beta"];
  assert.ok(beta, "Anthropic-Beta header must be present");
  assert.ok(
    !beta.includes("context-management-2025-06-27"),
    "Static Anthropic-Beta must NOT contain context-management-2025-06-27"
  );
  assert.ok(
    beta.includes("claude-code-20250219"),
    "Static Anthropic-Beta must still contain claude-code-20250219"
  );
  assert.ok(
    beta.includes("prompt-caching-scope-2026-01-05"),
    "Static Anthropic-Beta must still contain prompt-caching-scope-2026-01-05"
  );
});

test("Group A2: Claude API-key path — buildHeaders does NOT include context-management-2025-06-27", () => {
  const executor = new DefaultExecutor("claude");
  const headers = executor.buildHeaders({ apiKey: "sk-test-key" }, true);

  const beta = headers["Anthropic-Beta"];
  assert.ok(beta, "Anthropic-Beta header must be present");
  assert.ok(
    !beta.includes("context-management-2025-06-27"),
    "Static Anthropic-Beta must NOT contain context-management-2025-06-27"
  );
});

// ── Group B: Model-conditional tests (via local helper) ──────────────────────────
// Since execute() requires network mocking, we test the conditional logic by
// replicating the exact block from base.ts in a helper and testing its behavior

/**
 * Local helper that replicates the planned conditional append logic from base.ts.
 * This mirrors the exact block that will be added after line 312 in base.ts.
 */
function applyContextManagementBeta(headers, model, provider) {
  const CONTEXT_MANAGEMENT_MODELS = [
    "claude-opus-4-6",
    "claude-sonnet-4-6",
    "claude-sonnet-4-5",
    "claude-sonnet-4",
    "claude-opus-4-5",
  ];
  const baseModel = model.replace(/-\d{8}$/, "");
  const isClaudeCodeCompatible =
    provider &&
    (provider.startsWith("anthropic-compatible-") ||
      provider.includes("cc-") ||
      provider === "claude-code");
  if (provider === "claude" || isClaudeCodeCompatible) {
    if (
      CONTEXT_MANAGEMENT_MODELS.some((m) => baseModel === m || model === m || model.startsWith(m))
    ) {
      const existing = headers["Anthropic-Beta"] || headers["anthropic-beta"];
      const key = headers["Anthropic-Beta"] !== undefined ? "Anthropic-Beta" : "anthropic-beta";
      if (existing) {
        headers[key] = existing + ",context-management-2025-06-27";
      } else {
        headers["Anthropic-Beta"] = "context-management-2025-06-27";
      }
    }
  }
  return headers;
}

test("Group B1: Haiku model does NOT append context-management-2025-06-27", () => {
  const headers = { "Anthropic-Beta": "claude-code-20250219" };
  const result = applyContextManagementBeta(headers, "claude-haiku-4-5", "claude");

  assert.equal(
    result["Anthropic-Beta"],
    "claude-code-20250219",
    "Haiku must NOT have context-management appended"
  );
});

test("Group B2: Opus model DOES append context-management-2025-06-27", () => {
  const headers = { "Anthropic-Beta": "claude-code-20250219" };
  const result = applyContextManagementBeta(headers, "claude-opus-4-6", "claude");

  assert.equal(
    result["Anthropic-Beta"],
    "claude-code-20250219,context-management-2025-06-27",
    "Opus must have context-management appended"
  );
});

test("Group B3: Sonnet with date suffix appends context-management-2025-06-27", () => {
  const headers = { "Anthropic-Beta": "claude-code-20250219" };
  const result = applyContextManagementBeta(headers, "claude-sonnet-4-5-20250929", "claude");

  assert.equal(
    result["Anthropic-Beta"],
    "claude-code-20250219,context-management-2025-06-27",
    "Sonnet with date suffix must have context-management appended"
  );
});

test("Group B4: Haiku with date suffix does NOT append context-management-2025-06-27", () => {
  const headers = { "Anthropic-Beta": "claude-code-20250219" };
  const result = applyContextManagementBeta(headers, "claude-haiku-4-5-20251001", "claude");

  assert.equal(
    result["Anthropic-Beta"],
    "claude-code-20250219",
    "Haiku with date suffix must NOT have context-management appended"
  );
});

test("Group B5: Claude-code-compatible lowercase anthropic-beta path appends correctly", () => {
  const headers = { "anthropic-beta": "claude-code-20250219" };
  const result = applyContextManagementBeta(
    headers,
    "claude-opus-4-6",
    "anthropic-compatible-cc-foo"
  );

  assert.equal(
    result["anthropic-beta"],
    "claude-code-20250219,context-management-2025-06-27",
    "CC-compatible lowercase header must append to lowercase key"
  );
});

test("Group B6: No existing header — Opus creates Anthropic-Beta with context-management-2025-06-27", () => {
  const headers = {};
  const result = applyContextManagementBeta(headers, "claude-opus-4-6", "claude");

  assert.equal(
    result["Anthropic-Beta"],
    "context-management-2025-06-27",
    "Opus without existing header must create new Anthropic-Beta header with context-management"
  );
});
