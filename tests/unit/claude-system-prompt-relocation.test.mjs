import { describe, it } from "node:test";
import assert from "node:assert/strict";

const { openaiToClaudeRequest } =
  await import("../../open-sse/translator/request/openai-to-claude.ts");

describe("Claude OAuth system prompt relocation", () => {
  const oauthCreds = { accessToken: "tok_test", refreshToken: "ref_test" };
  const apiKeyCreds = { apiKey: "sk-test" };
  const model = "claude-opus-4-6";

  function makeBody(systemContent, userContent = "Hello") {
    const messages = [];
    if (systemContent) {
      messages.push({ role: "system", content: systemContent });
    }
    messages.push({ role: "user", content: userContent });
    return { messages, model };
  }

  it("OAuth Claude: system[] has only identity block", () => {
    const body = makeBody("Custom system instructions for the agent.");
    const result = openaiToClaudeRequest(model, body, false, oauthCreds, "claude");
    assert.equal(result.system.length, 1, "system should have only identity block");
    assert.ok(
      result.system[0].text.includes("Claude Code"),
      "identity block should contain Claude Code"
    );
  });

  it("OAuth Claude: stable preamble messages injected with cache_control", () => {
    const body = makeBody("Custom system instructions for the agent.");
    const result = openaiToClaudeRequest(model, body, false, oauthCreds, "claude");
    // First two messages should be preamble user + assistant ack
    assert.equal(result.messages[0].role, "user", "first message should be preamble user");
    assert.equal(result.messages[1].role, "assistant", "second message should be preamble ack");
    assert.equal(result.messages[1].content[0].text, "Understood.", "ack message content");
    // Preamble should have cache_control
    const preambleBlock = result.messages[0].content[0];
    assert.ok(preambleBlock.cache_control, "preamble should have cache_control");
    assert.ok(
      preambleBlock.text.includes("Custom system instructions"),
      "preamble has relocated text"
    );
  });

  it("OAuth Claude: relocated text prepended to first user message", () => {
    const body = makeBody("Custom system instructions for the agent.");
    const result = openaiToClaudeRequest(model, body, false, oauthCreds, "claude");
    const firstUser = result.messages.find((m) => m.role === "user");
    assert.ok(firstUser, "user message should exist");
    const firstContent = Array.isArray(firstUser.content)
      ? firstUser.content[0]
      : firstUser.content;
    assert.ok(
      firstContent.text.includes("Custom system instructions"),
      "relocated text should be in first user message"
    );
  });

  it("Non-OAuth Claude: system[] keeps both blocks", () => {
    const body = makeBody("Custom system instructions.");
    const result = openaiToClaudeRequest(model, body, false, apiKeyCreds, "claude");
    assert.equal(result.system.length, 2, "system should have identity + custom block");
  });

  it("Sanitization: lines with opencode removed, OpenCode in surviving text replaced", () => {
    const body = makeBody(
      "Use the tool wisely.\nopencode docs are here.\nThe OpenCode CLI is fast."
    );
    const result = openaiToClaudeRequest(model, body, false, oauthCreds, "claude");
    const firstUser = result.messages.find((m) => m.role === "user");
    const texts = Array.isArray(firstUser.content)
      ? firstUser.content.map((c) => c.text).join(" ")
      : firstUser.content;
    assert.ok(!texts.includes("opencode"), "lines with opencode should be removed");
    assert.ok(texts.includes("Use the tool wisely"), "non-matching lines should remain");
  });

  it("Sanitization: paragraphs with github.com/anomalyco/opencode removed", () => {
    const body = makeBody(
      "Good instructions.\n\nCheck github.com/anomalyco/opencode for docs.\n\nMore good instructions."
    );
    const result = openaiToClaudeRequest(model, body, false, oauthCreds, "claude");
    const firstUser = result.messages.find((m) => m.role === "user");
    const texts = Array.isArray(firstUser.content)
      ? firstUser.content.map((c) => c.text).join(" ")
      : firstUser.content;
    assert.ok(!texts.includes("anomalyco"), "anomalyco paragraph should be removed");
    assert.ok(texts.includes("Good instructions"), "non-matching text should remain");
    assert.ok(texts.includes("More good instructions"), "non-matching text should remain");
  });

  it("Empty systemParts: no relocation needed", () => {
    const body = makeBody(null);
    const result = openaiToClaudeRequest(model, body, false, oauthCreds, "claude");
    assert.equal(result.system.length, 1, "system should have only identity block");
    const firstUser = result.messages.find((m) => m.role === "user");
    const content = Array.isArray(firstUser.content) ? firstUser.content : [firstUser.content];
    assert.equal(content.length, 1, "user message should not have prepended text");
  });
});
