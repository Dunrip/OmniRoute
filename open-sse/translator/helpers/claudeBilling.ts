/**
 * Claude Billing Header (v1.5.0)
 *
 * Ported from @ex-machina/opencode-anthropic-auth v1.6.0 src/cch.ts.
 *
 * Computes the content-consistency hash (cch) that Anthropic reads to
 * attribute OAuth traffic back to Claude Code sessions. The header text
 * is prepended to the identity system block with a blank line separator;
 * upstream Anthropic parses it out of the prompt, not out of HTTP headers.
 */

import { createHash } from "node:crypto";
import {
  CCH_POSITIONS,
  CCH_SALT,
  CLAUDE_BILLING_HEADER_NAME,
  CLAUDE_CODE_ENTRYPOINT,
  CLAUDE_CODE_VERSION,
} from "@/shared/constants/claudeAuth";

type ClaudeTextBlock = { type?: string; text?: string };
type ClaudeMessage = {
  role?: string;
  content?: string | ClaudeTextBlock[] | unknown;
};

/** First user message's first text block (string or array form). */
export function extractFirstUserMessageText(messages: ClaudeMessage[]): string {
  const userMsg = messages.find((m) => m.role === "user");
  if (!userMsg) return "";

  const { content } = userMsg;
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    const textBlock = (content as ClaudeTextBlock[]).find((b) => b?.type === "text");
    if (textBlock?.text) return textBlock.text;
  }
  return "";
}

/** cch: first 5 hex chars of sha256(messageText). */
export function computeCCH(messageText: string): string {
  return createHash("sha256").update(messageText).digest("hex").slice(0, 5);
}

/** 3-char version suffix: sha256(SALT + sampledChars + version). */
export function computeVersionSuffix(
  messageText: string,
  version: string = CLAUDE_CODE_VERSION
): string {
  const chars = CCH_POSITIONS.map((i) => messageText[i] || "0").join("");
  return createHash("sha256").update(`${CCH_SALT}${chars}${version}`).digest("hex").slice(0, 3);
}

/** Full billing header text to prepend to the identity block. */
export function buildBillingHeaderValue(
  messages: ClaudeMessage[],
  version: string = CLAUDE_CODE_VERSION,
  entrypoint: string = CLAUDE_CODE_ENTRYPOINT
): string | null {
  if (!Array.isArray(messages)) return null;
  if (!messages.some((m) => m?.role === "user")) return null;

  const text = extractFirstUserMessageText(messages);
  const suffix = computeVersionSuffix(text, version);
  const cch = computeCCH(text);

  return (
    `${CLAUDE_BILLING_HEADER_NAME}: ` +
    `cc_version=${version}.${suffix}; ` +
    `cc_entrypoint=${entrypoint}; ` +
    `cch=${cch};`
  );
}
