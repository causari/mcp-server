/**
 * Causari MCP Server core.
 *
 * Wires CKGStore + tool handlers to the MCP protocol. Transport-agnostic;
 * cli.ts attaches the stdio transport.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CKGStore } from '@causari/ckg';
export declare function createCausariServer(opts?: {
    store?: CKGStore;
}): Server;
//# sourceMappingURL=server.d.ts.map