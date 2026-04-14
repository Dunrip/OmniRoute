/**
 * Claude CLI Authentication Constants
 *
 * Shared authentication configuration for Claude CLI OAuth flows.
 * Used by both src/lib/oauth/* and open-sse/* modules.
 *
 * Version: @ex-machina/opencode-anthropic-auth v1.6.0
 * Last Synced: 2026-04-14
 */

/**
 * User Agent string for Claude CLI requests.
 * Identifies the client as Claude CLI (external, non-browser).
 */
export const CLAUDE_CLI_USER_AGENT = "claude-cli/2.1.89 (external, cli)";

/**
 * Beta headers for Claude API requests.
 * Enables experimental features and API versions.
 *
 * - oauth-2025-04-20: OAuth 2.0 flow support
 * - interleaved-thinking-2025-05-14: Extended thinking capability
 *
 * NOTE: context-1m-2025-08-07 is intentionally NOT here. The 1M context
 * beta is gated by Anthropic per-subscription — Pro returns
 * "[400]: The long context beta is not yet available for this
 * subscription"; Max accepts it. All Claude 4.x models (Opus, Sonnet,
 * Haiku) support 1M context — the limitation is account tier, not
 * model capability. The beta is added conditionally in
 * open-sse/executors/base.ts when the [1m] suffix is used on a
 * whitelisted 4.x model.
 */
export const CLAUDE_BETA_HEADERS = "oauth-2025-04-20, interleaved-thinking-2025-05-14";

/**
 * OAuth Client ID for Claude CLI.
 * Identifies the application to Claude's OAuth provider.
 */
export const CLAUDE_OAUTH_CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e";

/**
 * OAuth Token Endpoint.
 * Used to exchange authorization code for access token.
 */
export const CLAUDE_TOKEN_ENDPOINT = "https://platform.claude.com/v1/oauth/token";

/**
 * OAuth Authorization Endpoint.
 * User is redirected here to grant permissions.
 */
export const CLAUDE_AUTHORIZE_ENDPOINT = "https://claude.ai/oauth/authorize";

/**
 * OAuth Redirect URI.
 * Where the OAuth provider redirects after user authorization.
 */
export const CLAUDE_REDIRECT_URI = "https://platform.claude.com/oauth/code/callback";

/**
 * OAuth Scopes requested by Claude CLI.
 * Defines the permissions requested from the user.
 */
export const CLAUDE_OAUTH_SCOPES = [
  "org:create_api_key",
  "user:profile",
  "user:inference",
  "user:sessions:claude_code",
  "user:mcp_servers",
  "user:file_upload",
];

/**
 * Beta query parameter.
 * Enables beta features in API requests.
 */
export const CLAUDE_BETA_QUERY_PARAM = "true";

/**
 * MCP Tool Prefix.
 * Prefix used for MCP (Model Context Protocol) tool names.
 *
 * v1.6.0 convention: the character immediately after the prefix is
 * uppercased (e.g. `bash` -> `mcp_Bash`). Lowercase names are
 * flagged by Anthropic's validator as non-Claude-Code clients and
 * result in a 400 rejection.
 */
export const MCP_TOOL_PREFIX = "mcp_";

/**
 * Billing header injected into the identity system block.
 * v1.5.0: content-consistency hashing derived from the first user
 * message. Anthropic reads this text-prepended header to attribute
 * usage back to Claude Code sessions.
 */
export const CLAUDE_BILLING_HEADER_NAME = "x-anthropic-billing-header";
export const CCH_SALT = "59cf53e54c78";
export const CCH_POSITIONS: readonly number[] = [4, 7, 20] as const;
export const CLAUDE_CODE_VERSION = "2.1.89";
export const CLAUDE_CODE_ENTRYPOINT = "sdk-cli";

/**
 * Claude Auth Configuration Object.
 * Aggregates all Claude authentication constants for convenience.
 */
export const CLAUDE_AUTH_CONFIG = {
  userAgent: CLAUDE_CLI_USER_AGENT,
  betaHeaders: CLAUDE_BETA_HEADERS,
  clientId: CLAUDE_OAUTH_CLIENT_ID,
  tokenEndpoint: CLAUDE_TOKEN_ENDPOINT,
  authorizeEndpoint: CLAUDE_AUTHORIZE_ENDPOINT,
  redirectUri: CLAUDE_REDIRECT_URI,
  scopes: CLAUDE_OAUTH_SCOPES,
  betaQueryParam: CLAUDE_BETA_QUERY_PARAM,
  toolPrefix: MCP_TOOL_PREFIX,
} as const;
