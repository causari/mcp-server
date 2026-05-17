/**
 * Smoke test — verifies the 5 tool handlers return sensible results
 * against the seed CKG data. Run: node dist/smoke.js
 */
import { CKGStore, loadSeed } from '@causari/ckg';
import { ALL_TOOLS } from './tools.js';
const store = new CKGStore(loadSeed());
const stats = store.stats();
console.log('CKG stats:', stats);
const tests = [
    {
        tool: 'query_events',
        args: { query: 'printing', limit: 5 },
        expect: (r) => r.events?.length > 0 && r.events[0].id === 'printing'
            ? null
            : `expected printing event, got ${JSON.stringify(r.events?.[0])}`,
    },
    {
        tool: 'query_events',
        args: { yearFrom: 1900, yearTo: 2000, minImpact: 0.85 },
        expect: (r) => r.events?.every((e) => e.yearNum >= 1900 && e.yearNum <= 2000 && e.impactScore >= 0.85)
            ? null
            : 'year/impact filter failed',
    },
    {
        tool: 'query_events',
        args: { domains: ['technology'], minImpact: 0.9 },
        expect: (r) => r.events?.every((e) => e.domains.includes('technology') && e.impactScore >= 0.9)
            ? null
            : 'domain/impact filter failed',
    },
    {
        tool: 'causal_chain',
        args: { event: 'printing', direction: 'effects', depth: 2 },
        expect: (r) => {
            if (r.error)
                return `unexpected error: ${r.error}`;
            if (r.root.id !== 'printing')
                return `wrong root: ${r.root.id}`;
            const titles = r.effects.map((e) => e.id);
            // printing → rena, printing → indus
            if (!titles.includes('rena'))
                return `missing rena in effects: ${titles.join(',')}`;
            return null;
        },
    },
    {
        tool: 'causal_chain',
        args: { event: 'transformer', direction: 'causes', depth: 3 },
        expect: (r) => {
            if (r.error)
                return `unexpected error: ${r.error}`;
            if (r.root.id !== 'transformer')
                return `wrong root: ${r.root.id}`;
            const ids = r.causes.map((c) => c.id);
            // transformer ← turing_m, dna_disc, iphone (depth 1)
            if (!ids.includes('turing_m'))
                return `missing turing_m: ${ids.join(',')}`;
            return null;
        },
    },
    {
        tool: 'causal_chain',
        args: { event: 'industrial', direction: 'both', depth: 2 },
        expect: (r) => {
            if (r.error)
                return `unexpected error: ${r.error}`;
            if (r.root.id !== 'indus')
                return `title fuzzy match should resolve "industrial" → indus, got: ${r.root.id}`;
            return null;
        },
    },
    {
        tool: 'causal_chain',
        args: { event: 'nonexistent_xyz' },
        expect: (r) => (r.error ? null : 'expected error for nonexistent event'),
    },
    {
        tool: 'historical_resonance',
        args: { situation: 'rapid democratization of knowledge through new technology' },
        expect: (r) => {
            if (!r.matches || r.matches.length === 0)
                return 'expected at least 1 match';
            // Should match info-democratization pattern
            const found = r.matches.find((m) => m.pattern.toLowerCase().includes('democratization'));
            return found ? null : `expected democratization pattern, got: ${r.matches.map((m) => m.pattern).join(', ')}`;
        },
    },
    {
        tool: 'predict_scenarios',
        args: {
            conditions: ['AI capabilities accelerating', 'open-source models improving'],
            horizon: 2040,
            domains: ['technology'],
        },
        expect: (r) => {
            if (!r.scenarios || r.scenarios.length === 0)
                return 'expected at least 1 scenario';
            if (!r.scenarios.every((s) => typeof s.probability === 'number'))
                return 'scenarios missing probability';
            return null;
        },
    },
    {
        tool: 'org_knowledge',
        args: { query: 'database decisions', orgId: 'demo-org-no-data' },
        expect: (r) => (r.available === false ? null : 'expected available=false for empty org'),
    },
    // ── AI history extension (events-ai-history.ts) ──────────────────────
    {
        tool: 'query_events',
        args: { query: 'chatgpt', limit: 3 },
        expect: (r) => r.events?.some((e) => e.id === 'chatgpt')
            ? null
            : `expected chatgpt in results, got: ${r.events?.map((e) => e.id).join(',')}`,
    },
    {
        tool: 'causal_chain',
        args: { event: 'chatgpt', direction: 'causes', depth: 4 },
        expect: (r) => {
            if (r.error)
                return `unexpected error: ${r.error}`;
            const ids = r.causes.map((c) => c.id);
            // chatgpt ← gpt3 ← gpt2 ← transformer ← alexnet
            if (!ids.includes('gpt3'))
                return `missing gpt3: ${ids.join(',')}`;
            if (!ids.includes('transformer'))
                return `missing transformer: ${ids.join(',')}`;
            return null;
        },
    },
];
let passed = 0;
let failed = 0;
const failures = [];
for (const t of tests) {
    const tool = ALL_TOOLS.find((x) => x.name === t.tool);
    if (!tool) {
        failures.push(`Unknown tool ${t.tool}`);
        failed++;
        continue;
    }
    const result = tool.handler(t.args, store);
    const err = t.expect(result);
    if (err) {
        failed++;
        failures.push(`[${t.tool}] ${JSON.stringify(t.args)}\n    → ${err}`);
    }
    else {
        passed++;
    }
}
console.log(`\n=== Smoke test ===`);
console.log(`PASS: ${passed}/${tests.length}`);
if (failed > 0) {
    console.log(`FAIL: ${failed}`);
    failures.forEach((f) => console.log(`  ${f}`));
    process.exit(1);
}
else {
    console.log('All tests passed.');
}
// Print one full sample so we can eyeball the LLM-facing format
console.log('\n=== Sample causal_chain output ===');
const sample = ALL_TOOLS.find((t) => t.name === 'causal_chain').handler({ event: 'transformer', direction: 'causes', depth: 2 }, store);
console.log(JSON.stringify(sample, null, 2));
//# sourceMappingURL=smoke.js.map