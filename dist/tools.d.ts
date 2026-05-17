/**
 * MCP tool definitions for Causari.
 *
 * Each tool wraps a CKG query function and shapes the result for LLM consumption.
 * Output shape priorities:
 *  1. Token-efficient — drop redundant fields
 *  2. Self-explanatory — include relationship + evidence so LLM doesn't need to re-query
 *  3. Calibrated — surface confidence + sources so LLM can communicate uncertainty
 */
import { CKGStore } from '@causari/ckg';
export interface ToolDef {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, unknown>;
        required?: string[];
    };
    handler: (args: Record<string, unknown>, store: CKGStore) => unknown;
}
export declare const queryEventsT: ToolDef;
export declare const causalChainT: ToolDef;
export declare const historicalResonanceT: ToolDef;
export declare const orgKnowledgeT: ToolDef;
export declare const predictScenariosT: ToolDef;
export declare const ALL_TOOLS: ToolDef[];
//# sourceMappingURL=tools.d.ts.map