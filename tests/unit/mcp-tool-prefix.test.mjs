import test from "node:test";
import assert from "node:assert/strict";

const { CLAUDE_OAUTH_TOOL_PREFIX, openaiToClaudeRequest } =
  await import("../../open-sse/translator/request/openai-to-claude.ts");

// ── constant value ────────────────────────────────────────────────────────────

test("CLAUDE_OAUTH_TOOL_PREFIX is mcp_", () => {
  assert.equal(CLAUDE_OAUTH_TOOL_PREFIX, "mcp_");
});

// ── normal prefixing ──────────────────────────────────────────────────────────

test("tool names without the prefix get mcp_ prepended", () => {
  const result = openaiToClaudeRequest(
    "claude-sonnet-4-6",
    {
      messages: [{ role: "user", content: "run tool" }],
      tools: [
        {
          type: "function",
          function: {
            name: "read_file",
            description: "Read a file",
            parameters: { type: "object", properties: {} },
          },
        },
      ],
    },
    false
  );

  assert.equal(result.tools.length, 1);
  assert.equal(result.tools[0].name, "mcp_read_file");
  assert.equal(result._toolNameMap.get("mcp_read_file"), "read_file");
});

// ── double-prefix guard ───────────────────────────────────────────────────────

test("tool name already starting with mcp_ is not double-prefixed", () => {
  const result = openaiToClaudeRequest(
    "claude-sonnet-4-6",
    {
      messages: [{ role: "user", content: "run tool" }],
      tools: [
        {
          type: "function",
          function: {
            name: "mcp_read_file",
            description: "Read a file",
            parameters: { type: "object", properties: {} },
          },
        },
      ],
    },
    false
  );

  assert.equal(result.tools.length, 1);
  assert.equal(result.tools[0].name, "mcp_read_file");
  // Map key and value are both mcp_read_file when already prefixed
  assert.equal(result._toolNameMap.get("mcp_read_file"), "mcp_read_file");
});

test("tool_calls in assistant messages are not double-prefixed", () => {
  const result = openaiToClaudeRequest(
    "claude-sonnet-4-6",
    {
      messages: [
        {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call_1",
              type: "function",
              function: { name: "mcp_read_file", arguments: "{}" },
            },
          ],
        },
      ],
    },
    false
  );

  const assistantMsg = result.messages.find((m) => m.role === "assistant");
  assert.ok(assistantMsg, "expected an assistant message");
  const toolUse = assistantMsg.content.find((b) => b.type === "tool_use");
  assert.ok(toolUse, "expected a tool_use block");
  assert.equal(toolUse.name, "mcp_read_file");
});

// ── empty / missing tools ─────────────────────────────────────────────────────

test("empty tools array does not error and produces no tools in output", () => {
  const result = openaiToClaudeRequest(
    "claude-sonnet-4-6",
    {
      messages: [{ role: "user", content: "hello" }],
      tools: [],
    },
    false
  );

  assert.deepEqual(result.tools, []);
  assert.equal(result._toolNameMap, undefined);
});

test("missing tools key does not error", () => {
  const result = openaiToClaudeRequest(
    "claude-sonnet-4-6",
    {
      messages: [{ role: "user", content: "hello" }],
    },
    false
  );

  assert.equal(result.tools, undefined);
  assert.equal(result._toolNameMap, undefined);
});

test("tool with empty name is filtered out without error", () => {
  const result = openaiToClaudeRequest(
    "claude-sonnet-4-6",
    {
      messages: [{ role: "user", content: "hello" }],
      tools: [
        {
          type: "function",
          function: {
            name: "",
            description: "bad tool",
            parameters: { type: "object", properties: {} },
          },
        },
      ],
    },
    false
  );

  assert.deepEqual(result.tools, []);
  assert.equal(result._toolNameMap, undefined);
});

// ── prefix disabled ───────────────────────────────────────────────────────────

test("_disableToolPrefix skips prefixing entirely", () => {
  const result = openaiToClaudeRequest(
    "claude-sonnet-4-6",
    {
      _disableToolPrefix: true,
      messages: [{ role: "user", content: "run tool" }],
      tools: [
        {
          type: "function",
          function: {
            name: "read_file",
            description: "Read a file",
            parameters: { type: "object", properties: {} },
          },
        },
      ],
    },
    false
  );

  assert.equal(result.tools[0].name, "read_file");
  assert.equal(result._toolNameMap, undefined);
});
