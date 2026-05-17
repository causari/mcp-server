#!/usr/bin/env node
/**
 * Causari MCP Server — local CLI.
 *
 * Usage:
 *   causari-mcp                    # stdio transport (for Claude Code, Cursor)
 *   npx @causari/mcp-server        # same, no install
 *
 * Configure in Claude Code .mcp.json:
 *   {
 *     "mcpServers": {
 *       "causari": { "command": "causari-mcp" }
 *     }
 *   }
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createCausariServer } from './server.js';
async function main() {
    const server = createCausariServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // Server now runs until stdin closes.
}
main().catch((err) => {
    process.stderr.write(`causari-mcp fatal: ${err instanceof Error ? err.stack : String(err)}\n`);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map