/**
 * MCP tool definitions for Causari.
 *
 * Each tool wraps a CKG query function and shapes the result for LLM consumption.
 * Output shape priorities:
 *  1. Token-efficient — drop redundant fields
 *  2. Self-explanatory — include relationship + evidence so LLM doesn't need to re-query
 *  3. Calibrated — surface confidence + sources so LLM can communicate uncertainty
 */
import { queryEvents, causalChain, historicalResonance, orgKnowledge, predictScenarios, } from '@causari/ckg';
const yearRangeSchema = {
    yearFrom: {
        type: 'number',
        description: 'Inclusive start year. Negative = BCE. Example: -3500 for 3500 BCE, 1900 for 1900 CE.',
    },
    yearTo: {
        type: 'number',
        description: 'Inclusive end year. Negative = BCE.',
    },
};
const domainsSchema = {
    type: 'array',
    items: {
        type: 'string',
        enum: ['technology', 'humanities', 'systems', 'science', 'economy', 'geopolitics', 'philosophy', 'environment', 'culture', 'health', 'other'],
    },
    description: 'Filter to events in these knowledge domains.',
};
// ── Tool 1: query_events ────────────────────────────────────────────────
export const queryEventsT = {
    name: 'query_events',
    description: 'Search the Causari causal knowledge graph for historical events matching given criteria. ' +
        'Returns structured event records with title, description, year, domains, impact score, and tags. ' +
        'Use this when you need historical context for a topic, time period, or domain.',
    inputSchema: {
        type: 'object',
        properties: {
            ...yearRangeSchema,
            domains: domainsSchema,
            minImpact: {
                type: 'number',
                minimum: 0,
                maximum: 1,
                description: 'Filter to events with impact score >= this. Use 0.7+ for major events only.',
            },
            query: {
                type: 'string',
                description: 'Free-text search across title, description, and tags. Case-insensitive.',
            },
            limit: { type: 'number', description: 'Max events to return. Default 20.', default: 20 },
        },
    },
    handler: (args, store) => {
        const result = queryEvents(store, {
            yearFrom: args.yearFrom,
            yearTo: args.yearTo,
            domains: args.domains,
            minImpact: args.minImpact,
            query: args.query,
            limit: args.limit,
        });
        return {
            events: result.events.map((e) => ({
                id: e.id,
                title: e.title,
                year: e.yearLabel,
                yearNum: e.yearNum,
                description: e.description,
                domains: e.domains,
                impactScore: e.impactScore,
                tags: e.tags,
                ...(e.forecastConfidence !== undefined && {
                    forecast: { confidence: e.forecastConfidence, reasoning: e.forecastReasoning },
                }),
            })),
            totalMatched: result.totalMatched,
            truncated: result.truncated,
            ...(result.truncated && {
                hint: `${result.totalMatched} events matched but only ${result.events.length} returned. Use minImpact or domains to narrow.`,
            }),
        };
    },
};
// ── Tool 2: causal_chain ─────────────────────────────────────────────────
export const causalChainT = {
    name: 'causal_chain',
    description: 'Trace cause-effect chains from a historical event. Returns structured causal graph showing what led to the event (causes) and/or what it enabled (effects), with evidence and confidence scores. ' +
        'This is the most powerful Causari tool for understanding WHY something happened or what consequences flow from a development. ' +
        "Example: causal_chain('printing press', direction='effects', depth=2) returns the cascade from Gutenberg through Renaissance to Industrial Revolution.",
    inputSchema: {
        type: 'object',
        properties: {
            event: {
                type: 'string',
                description: 'Event ID (e.g. "printing", "internet") or title substring (e.g. "industrial").',
            },
            direction: {
                type: 'string',
                enum: ['causes', 'effects', 'both'],
                description: 'causes = what led to this event. effects = what flowed from it. both = full chain.',
                default: 'both',
            },
            depth: {
                type: 'number',
                minimum: 1,
                maximum: 5,
                description: 'Hops to traverse from the root event. Default 2.',
                default: 2,
            },
            minConfidence: {
                type: 'number',
                minimum: 0,
                maximum: 1,
                description: 'Filter out causal links below this confidence. Default 0 (include all).',
            },
        },
        required: ['event'],
    },
    handler: (args, store) => {
        const result = causalChain(store, {
            event: args.event,
            direction: args.direction,
            depth: args.depth,
            minConfidence: args.minConfidence,
        });
        if ('notFound' in result && result.notFound) {
            return {
                error: `No event found matching "${result.notFound}". Try query_events first to find the right ID.`,
            };
        }
        const r = result;
        return {
            root: {
                id: r.root.id,
                title: r.root.title,
                year: r.root.yearLabel,
                description: r.root.description,
            },
            causes: r.nodes
                .filter((n) => n.direction === 'cause')
                .map((n) => ({
                id: n.event.id,
                title: n.event.title,
                year: n.event.yearLabel,
                hop: n.hop,
                relationship: n.via?.relationship,
                confidence: n.via?.confidence,
                evidence: n.via?.evidence,
            })),
            effects: r.nodes
                .filter((n) => n.direction === 'effect')
                .map((n) => ({
                id: n.event.id,
                title: n.event.title,
                year: n.event.yearLabel,
                hop: n.hop,
                relationship: n.via?.relationship,
                confidence: n.via?.confidence,
                evidence: n.via?.evidence,
            })),
            relatedPatterns: r.relatedInsights.map((i) => ({
                pattern: i.pattern,
                description: i.description,
                predictiveValue: i.predictiveValue,
            })),
            meta: {
                totalNodes: r.nodes.length,
                totalLinks: r.links.length,
            },
        };
    },
};
// ── Tool 3: historical_resonance ─────────────────────────────────────────
export const historicalResonanceT = {
    name: 'historical_resonance',
    description: 'Find historical patterns similar to a current situation. Useful for understanding contemporary events through historical parallels — e.g., "rapid AI adoption displacing knowledge workers" might resonate with the printing press disrupting clergy. ' +
        'Returns matched patterns with exemplar historical events and predictive value scores.',
    inputSchema: {
        type: 'object',
        properties: {
            situation: {
                type: 'string',
                description: 'Free-text description of the current situation, technology shift, or social pattern you want to find historical parallels for.',
            },
            domains: domainsSchema,
            maxResults: { type: 'number', default: 3 },
        },
        required: ['situation'],
    },
    handler: (args, store) => {
        const result = historicalResonance(store, {
            situation: args.situation,
            domains: args.domains,
            maxResults: args.maxResults,
        });
        return {
            matches: result.matches.map((m) => ({
                pattern: m.insight.pattern,
                description: m.insight.description,
                matchScore: Number(m.matchScore.toFixed(2)),
                predictiveValue: m.insight.predictiveValue,
                reasoning: m.reasoning,
                exemplars: m.exemplarEvents.map((e) => ({
                    title: e.title,
                    year: e.yearLabel,
                    why: e.description.slice(0, 160),
                })),
            })),
            ...(result.matches.length === 0 && {
                hint: 'No strong matches. Try adding more keywords or removing domain filters.',
            }),
        };
    },
};
// ── Tool 4: org_knowledge (Enterprise stub) ──────────────────────────────
export const orgKnowledgeT = {
    name: 'org_knowledge',
    description: "[Enterprise tier] Query the organization's internal causal knowledge graph — decisions, events, technical milestones, and their consequences. " +
        'Returns events scoped to the org and the causal context linking them. ' +
        'Note: requires enterprise tier API key with org scope; returns empty result + message if no org graph configured.',
    inputSchema: {
        type: 'object',
        properties: {
            query: { type: 'string', description: 'Free-text query for org-internal events.' },
            orgId: { type: 'string', description: 'Organization identifier (provisioned by enterprise admin).' },
            team: { type: 'string', description: 'Optional team/department filter.' },
            ...yearRangeSchema,
        },
        required: ['query', 'orgId'],
    },
    handler: (args, store) => {
        return orgKnowledge(store, {
            query: args.query,
            orgId: args.orgId,
            team: args.team,
            yearFrom: args.yearFrom,
            yearTo: args.yearTo,
        });
    },
};
// ── Tool 5: predict_scenarios ────────────────────────────────────────────
export const predictScenariosT = {
    name: 'predict_scenarios',
    description: 'Generate plausible future scenarios based on historical causal patterns and current conditions. ' +
        'Returns multiple scenario branches (optimistic / cautious / discontinuous) with probability estimates, reasoning, and historical basis. ' +
        'Useful for strategic planning, risk assessment, and stress-testing assumptions.',
    inputSchema: {
        type: 'object',
        properties: {
            conditions: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of current conditions or trends. e.g., ["AI capability accelerating", "open-source LLMs improving"].',
            },
            horizon: {
                type: 'number',
                description: 'Year horizon for scenarios. Default 2040.',
                default: 2040,
            },
            domains: domainsSchema,
            maxScenarios: { type: 'number', default: 3 },
        },
        required: ['conditions'],
    },
    handler: (args, store) => {
        const result = predictScenarios(store, {
            conditions: args.conditions,
            horizon: args.horizon,
            domains: args.domains,
            maxScenarios: args.maxScenarios,
        });
        return {
            scenarios: result.scenarios.map((s) => ({
                name: s.name,
                probability: Number(s.probability.toFixed(2)),
                reasoning: s.reasoning,
                historicalBasis: s.historicalBasis,
                keyEvents: s.events.map((e) => ({
                    title: e.title,
                    year: e.yearLabel,
                    forecastConfidence: e.forecastConfidence,
                    description: e.description,
                })),
            })),
            meta: {
                ...result.basedOn,
                disclaimer: 'Scenarios are derived from historical pattern matching, not guaranteed forecasts. ' +
                    'Confidence reflects internal CKG calibration only.',
            },
        };
    },
};
export const ALL_TOOLS = [
    queryEventsT,
    causalChainT,
    historicalResonanceT,
    orgKnowledgeT,
    predictScenariosT,
];
//# sourceMappingURL=tools.js.map