# @causari/mcp-server

> **Wikipedia for AI agents.** A Model Context Protocol server that gives Claude Code, Cursor, Windsurf — or any MCP-compatible AI agent — structured causal knowledge: 100+ events, 130+ causal links with confidence scores, and 8 insight patterns across computing history.

<!-- TODO: Replace with 10s hero GIF showing Claude Code calling causal_chain("kubernetes") -->
<!-- ![Causari MCP in action](assets/hero.gif) -->

### Install in 60 seconds

```json
{
  "mcpServers": {
    "causari": { "command": "npx", "args": ["-y", "@causari/mcp-server"] }
  }
}
```

Add to `.mcp.json` (Claude Code) or `~/.cursor/mcp.json` (Cursor). Restart your IDE. Done.

---

## 3 things you can do

**1. "Why does Kubernetes exist?"** → `causal_chain("kubernetes", depth: 3)` returns: Docker containers → Linux cgroups → Unix philosophy → and the pattern that open standards win infrastructure wars. Every link has evidence + confidence.

**2. "My startup competes with a closed platform using an open protocol"** → `historical_resonance(...)` matches TCP/IP vs OSI, Linux vs proprietary Unix, Web vs AOL. Returns predictive value scores and historical exemplars.

**3. "High-impact computing events 1990-2010"** → `query_events(yearFrom: 1990, yearTo: 2010, domains: ["technology"])` returns Linux, World Wide Web, Java, Google, iPhone, Bitcoin — structured, filterable, scored by impact.

---

## Why this exists

Wikipedia is excellent for humans, but unstructured for AI parsing. When you ask Claude *"trace what led to the Transformer architecture"*, it stitches together prose memory — fluent but unsourced and uncalibrated.

This MCP server hands the agent a **structured causal graph** instead:

- **Nodes**: historical events with year, domain, impact score, sources
- **Edges**: causal links (`caused` / `enabled` / `accelerated` / `delayed` / `prevented`) with confidence + evidence text
- **Patterns**: recurring causal insights ("Information Democratization Cycle", "Substrate Substitution") that the agent can reuse for analogical reasoning

The agent reasons over real structure — and tells the user what it knows, where it's calibrated, and where it isn't.

| | Plain Claude / Wikipedia lookup | Causari MCP |
|---|---|---|
| Output shape | Prose paragraphs | Structured nodes + edges |
| Causal claims | Stitched from memory | Edges with confidence 0–1 + evidence text |
| Provenance | None inline | Source attributions per event |
| Pattern matching | Ad hoc | Named insight patterns reusable across queries |
| Token cost | High (verbose prose) | Low (compact JSON, no redundant fields) |
| Multi-hop reasoning | Implicit, opaque | Explicit BFS over the graph |

---

## Tools

| Tool | What it does | When to call it |
|---|---|---|
| `query_events` | Search events by time / domain / impact / free text | You need historical context for a topic, era, or domain |
| `causal_chain` | BFS up/down the causal graph from a root event | You need to understand **why** something happened, or **what it enabled** |
| `historical_resonance` | Find historical patterns parallel to a present-day situation | You're reasoning about a current trend and want analogies with predictive value |
| `org_knowledge` | *(Enterprise tier)* Query an organization's private CKG | Working inside an enterprise namespace with private events configured |
| `predict_scenarios` | Generate scenario branches from current conditions + historical patterns | Strategic planning, stress-testing assumptions, risk assessment |

In Claude Code these surface as `mcp__causari__causal_chain` (and similar), depending on the IDE's prefixing convention.

---

## Quick start

### Option 1 — npm (recommended)

```json
{
  "mcpServers": {
    "causari": { "command": "npx", "args": ["-y", "@causari/mcp-server"] }
  }
}
```

Add to `.mcp.json` (Claude Code project or `~/.claude/mcp.json` global) or `~/.cursor/mcp.json` (Cursor).

### Option 2 — From source

```bash
git clone https://github.com/causari/mcp-server
cd mcp-server
pnpm install && pnpm build
```

```json
{
  "mcpServers": {
    "causari": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/cli.js"]
    }
  }
}
```

### Verify it works

In Claude Code:

> Use the causari `causal_chain` tool to trace what led to the Transformer architecture, depth 3.

You should see a structured response with nodes, confidence scores, and an evidence chain — not just prose.

---

## Sample outputs

### `causal_chain` — root: "transformer", direction: "causes", depth: 2

```json
{
  "root": { "id": "transformer", "title": "Transformer Architecture", "year": "2017" },
  "causes": [
    {
      "id": "turing_m", "title": "Turing Machine", "year": "1950", "hop": 1,
      "relationship": "enabled", "confidence": 0.8,
      "evidence": "Computational substrate for all neural architectures traces to Turing-complete machines."
    },
    {
      "id": "mcculloch_pitts", "title": "McCulloch-Pitts Neuron", "year": "1943", "hop": 2,
      "relationship": "enabled", "confidence": 0.9,
      "evidence": "First formal model of artificial neurons; the foundational abstraction."
    }
  ],
  "relatedPatterns": [
    {
      "pattern": "Substrate Substitution",
      "description": "A capability historically running on substrate A migrates to substrate B once B becomes cheaper or more flexible.",
      "predictiveValue": 0.78
    }
  ]
}
```

### `historical_resonance` — situation: "rapid democratization of knowledge through new technology"

Matches **Information Democratization Cycle** (predictive value 0.85), with exemplars spanning Language → Writing → Printing Press → Internet → Transformers — giving the agent a calibrated historical scaffold to reason from.

---

## Status & roadmap

This is honest reporting, not marketing copy.

**Current data depth (as of 2026-05-15):**

- **100 events** curated (35 civilizational, 15 AI history, 50 computing & software engineering)
- **132 causal links** with evidence text + confidence scores
- **8 insight patterns** (including 3 tech-specific: Abstraction Layer Migration, Standardization Cycle, Open vs Proprietary Substrate)

**Primary vertical: History of Computing & Software Engineering.** Queries like `causal_chain("docker")`, `causal_chain("kubernetes")`, or `historical_resonance("microservices vs monolith")` return meaningful causal context with evidence chains.

**Honest limitations:**

- Confidence scores are curator estimates, not statistical posteriors.
- `predict_scenarios` is pattern-matching over the historical record, not probabilistic forecasting. Treat output as structured hypotheses, not predictions.
- Coverage outside computing/AI history is thinner. We're expanding verticals based on user demand.

**Deferred per ADR-0004:**

- AI inference pipeline (Phase 2) — LLM-assisted causal link extraction at scale
- D1 backend + HTTP transport (Phase 3) — hosted MCP endpoint at `mcp.causari.ai`
- Org/Personal scope ingestion (Phase 4) — user-curated private CKG
- Embedding-based resonance (Phase 2) — replace lexical match with semantic similarity

---

## Smoke test

```bash
npm run build
node dist/smoke.js
```

Expected: `PASS: 10/10` with a sample causal chain printed. The smoke covers tool registration, query correctness on known events, and edge cases (missing event, depth cap).

---

## Architecture

```
┌────────────────────────┐
│  AI Agent (Claude Code,│
│   Cursor, Windsurf)    │
└──────┬─────────────────┘
       │ MCP protocol (stdio)
       ▼
┌────────────────────────┐
│  @causari/mcp-server   │
│  - tools.ts            │  ← 5 tool definitions, output shaping
│  - server.ts           │  ← Server + request handlers
│  - cli.ts              │  ← stdio transport entry
└──────┬─────────────────┘
       │ imports
       ▼
┌────────────────────────┐
│  @causari/ckg          │
│  - types               │  ← schema (Event, CausalLink, Insight)
│  - store               │  ← in-memory + adjacency indexes
│  - query               │  ← BFS, search, resonance, scenarios
│  - seed                │  ← curated events + links (open data, ADR-0011)
└────────────────────────┘
```

Token-efficiency note: tool outputs drop redundant fields and inline `relationship` + `evidence` so the LLM doesn't have to re-query for context. Confidence + provenance is surfaced so the model can communicate uncertainty honestly to the user.

---

## Contributing

The seed dataset is open under CC-BY-SA 4.0 in the [`causari/causari-data`](https://github.com/causari/causari-data) repo. See its [CONTRIBUTING.md](https://github.com/causari/causari-data/blob/main/CONTRIBUTING.md) for event/link submission guidelines.

For server code contributions, file issues or PRs here.

---

## License

Server code: MIT (this package).
Dataset (when published separately): CC-BY-SA 4.0.

---

## Related

- [Causari Powflow Canvas](https://causari-demo.pages.dev) — the same CKG, visualized for humans
- Architecture decisions are documented internally in the Causari monorepo
- [Model Context Protocol](https://modelcontextprotocol.io) — the open standard this server implements
