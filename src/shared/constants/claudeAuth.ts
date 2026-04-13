/**
 * Claude CLI Authentication Constants
 *
 * Shared authentication configuration for Claude CLI OAuth flows.
 * Used by both src/lib/oauth/* and open-sse/* modules.
 *
 * Version: @ex-machina/opencode-anthropic-auth v1.4.0
 * Last Synced: 2026-04-12
 */

/**
 * User Agent string for Claude CLI requests.
 * Identifies the client as Claude CLI (external, non-browser).
 */
export const CLAUDE_CLI_USER_AGENT = "claude-cli/2.1.2 (external, cli)";

/**
 * Beta headers for Claude API requests.
 * Enables experimental features and API versions.
 *
 * - oauth-2025-04-20: OAuth 2.0 flow support
 * - interleaved-thinking-2025-05-14: Extended thinking capability
 */
export const CLAUDE_BETA_HEADERS =
  "oauth-2025-04-20, interleaved-thinking-2025-05-14, context-1m-2025-08-07";

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
 */
export const MCP_TOOL_PREFIX = "mcp_";

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
