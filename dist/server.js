/**
 * Causari MCP Server core.
 *
 * Wires CKGStore + tool handlers to the MCP protocol. Transport-agnostic;
 * cli.ts attaches the stdio transport.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { CKGStore, loadSeed } from '@causari/ckg';
import { ALL_TOOLS } from './tools.js';
export function createCausariServer(opts = {}) {
    const store = opts.store ?? new CKGStore(loadSeed());
    const server = new Server({
        name: 'causari-mcp-server',
        version: '0.1.0',
    }, {
        capabilities: {
            tools: {},
        },
    });
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: ALL_TOOLS.map((t) => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema,
        })),
    }));
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const tool = ALL_TOOLS.find((t) => t.name === request.params.name);
        if (!tool) {
            return {
                content: [
                    { type: 'text', text: `Unknown tool: ${request.params.name}` },
                ],
                isError: true,
            };
        }
        try {
            const result = tool.handler(request.params.arguments ?? {}, store);
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return {
                content: [{ type: 'text', text: `Tool error: ${message}` }],
                isError: true,
            };
        }
    });
    return server;
}
//# sourceMappingURL=server.js.map