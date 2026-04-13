/**
 * Deterministic unit tests for Claude OAuth request-header injection.
 *
 * Verifies that:
 *  1. The Claude OAuth path (accessToken-only) gets User-Agent and Anthropic-Beta
 *     sourced from shared constants, and does NOT include x-api-key.
 *  2. The Claude API-key path sets x-api-key (and still carries the registry headers).
 *  3. Non-Claude providers do not receive Claude-specific header values.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { DefaultExecutor } from "../../open-sse/executors/default.ts";
import {
  CLAUDE_CLI_USER_AGENT,
  CLAUDE_BETA_HEADERS,
} from "../../src/shared/constants/claudeAuth.ts";

// ── Claude OAuth path ─────────────────────────────────────────────────────────

test("Claude OAuth: Authorization is Bearer, x-api-key absent, User-Agent from constant", () => {
  const executor = new DefaultExecutor("claude");
  const headers = executor.buildHeaders({ accessToken: "oauth-access-token" }, true);

  assert.equal(
    headers["Authorization"],
    "Bearer oauth-access-token",
    "OAuth path must set Authorization: Bearer <token>"
  );
  assert.equal(headers["x-api-key"], undefined, "OAuth path must NOT include x-api-key");
  assert.equal(
    headers["User-Agent"],
    CLAUDE_CLI_USER_AGENT,
    "User-Agent must match the shared CLAUDE_CLI_USER_AGENT constant"
  );
});

test("Claude OAuth: Anthropic-Beta contains both required beta flags from shared constant", () => {
  const executor = new DefaultExecutor("claude");
  const headers = executor.buildHeaders({ accessToken: "oauth-access-token" }, false);

  const beta = headers["Anthropic-Beta"];
  assert.ok(beta, "Anthropic-Beta header must be present");

  // Both individual values from CLAUDE_BETA_HEADERS must appear in the header.
  for (const flag of CLAUDE_BETA_HEADERS.split(",").map((s) => s.trim())) {
    assert.ok(
      beta.includes(flag),
      `Anthropic-Beta must include '${flag}' (from CLAUDE_BETA_HEADERS constant)`
    );
  }
});

// ── Claude API-key path ──────────────────────────────────────────────────────

test("Claude API-key path: x-api-key is set, Authorization absent, registry headers present", () => {
  const executor = new DefaultExecutor("claude");
  const headers = executor.buildHeaders({ apiKey: "sk-test-key" }, true);

  assert.equal(headers["x-api-key"], "sk-test-key", "API-key path must set x-api-key header");
  assert.equal(
    headers["Authorization"],
    undefined,
    "API-key path must NOT set Authorization header"
  );
  // Registry-injected headers still present on the API-key path.
  assert.equal(
    headers["User-Agent"],
    CLAUDE_CLI_USER_AGENT,
    "User-Agent must still equal CLAUDE_CLI_USER_AGENT on API-key path"
  );
  const beta = headers["Anthropic-Beta"];
  assert.ok(beta && beta.length > 0, "Anthropic-Beta must be present on API-key path");
});

// ── Non-Claude providers unaffected ─────────────────────────────────────────

test("Non-Claude provider (openai) does not receive Claude-specific header values", () => {
  const executor = new DefaultExecutor("openai");
  const headers = executor.buildHeaders({ apiKey: "sk-openai-key" }, true);

  assert.equal(headers["Authorization"], "Bearer sk-openai-key", "OpenAI must use Bearer auth");
  // Must not carry Anthropic-Beta or the Claude CLI User-Agent.
  assert.equal(headers["Anthropic-Beta"], undefined, "OpenAI must NOT have Anthropic-Beta header");
  assert.notEqual(
    headers["User-Agent"],
    CLAUDE_CLI_USER_AGENT,
    "OpenAI must NOT use the Claude CLI User-Agent value"
  );
  assert.equal(headers["x-api-key"], undefined, "OpenAI must NOT have x-api-key (uses Bearer)");
});

test("Non-Claude provider (anthropic direct API-key) does not get OAuth beta flags", () => {
  const executor = new DefaultExecutor("anthropic");
  const headers = executor.buildHeaders({ apiKey: "sk-ant-direct" }, false);

  // 'anthropic' goes through the default branch which sets Authorization: Bearer.
  assert.equal(
    headers["Authorization"],
    "Bearer sk-ant-direct",
    "Direct Anthropic API-key path uses Authorization: Bearer via default branch"
  );
  // 'anthropic' registry entry has no Anthropic-Beta, so it must be absent.
  assert.equal(
    headers["Anthropic-Beta"],
    undefined,
    "Direct Anthropic provider must NOT carry Anthropic-Beta (Claude OAuth flag)"
  );
  // Confirm no x-api-key — the 'anthropic' case falls through to the else branch.
  assert.equal(
    headers["x-api-key"],
    undefined,
    "Direct Anthropic provider must NOT set x-api-key via default branch"
  );
});
