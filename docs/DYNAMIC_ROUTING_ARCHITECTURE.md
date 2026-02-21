# Dynamic Routing Architecture (Mermaid)

## 1) Runtime Decision Flow
```mermaid
flowchart LR
  A[Client Session] --> B[POST /api/routing/next-step-v2]
  B --> C[buildRoutingContextV2]
  C --> D[loadPrecomputedCandidates]
  D --> E[rankCandidatesV2]
  E --> F[Decision + Chosen Step]
  F --> G[(routing_decisions_v2)]
  F --> H[(routing_events: decision_created)]
  F --> I[Client UI Next Step Card]
```

## 2) Outcome + Swarm Learning Flow
```mermaid
flowchart LR
  A[Client Action] --> B[POST /api/routing/outcome-v2]
  B --> C[(routing_outcomes_v2)]
  B --> D[(routing_events: outcome_reported)]
  B --> E[RPC update_swarm_edge_stats_after_outcome]
  E --> F[(swarm_edge_stats)]
```

## 3) Active Intervention Flow
```mermaid
flowchart LR
  A[useIdleAwareTelemetry] --> B{High Cognitive Load + High Hesitation}
  B -- yes --> C[UI Intervention Prompt]
  C --> D[Breathing Micro-Action]
  C --> E[Continue Anyway]
  B -- yes --> F[POST /api/routing/intervention-trigger]
  F --> G[(routing_events: intervention_triggered)]
  G --> H[Owner Dashboard Intervention Health]
```

## 4) Precompute and Cache Pipeline
```mermaid
flowchart LR
  A[(knowledge_edges/content_items/swarm_edge_stats)] --> B[Precompute Worker 1-3h]
  B --> C[(routing_candidate_cache TTL 6h)]
  C --> D[next-step-v2 cache lookup]
```

## 5) Exploration/Exploitation Guardrail
```mermaid
flowchart TB
  A[Candidate Set] --> B{epsilon-greedy}
  B -- 85% --> C[Exploit best decayed score]
  B -- 15% --> D[Explore eligible candidate]
  C --> E[Decision]
  D --> E
  E --> F[Outcome feedback]
  F --> G[Swarm stats + decay updates]
```

## 6) Observability Model
```mermaid
flowchart LR
  A[(routing_decisions_v2)] --> O[Owner Overview API]
  B[(routing_outcomes_v2)] --> O
  C[(routing_candidate_cache)] --> O
  D[(routing_events)] --> O
  E[(swarm_edge_stats)] --> O
  O --> F[Dashboard KPIs]
  F --> G[Fallback/Exploration/Cognitive Matrix/Latency Quality/Intervention Health]
```

## 7) Load Gate in CI
```mermaid
flowchart LR
  A[CI Pipeline] --> B[npm run routing:load-gate]
  B --> C{Threshold Check}
  C -- pass --> D[Deploy Allowed]
  C -- fail --> E[Build Failed]
  B --> F[p95, error rate, success counts]
```

## Suggested README Snippet
```md
### Dynamic Routing Architecture
See: `docs/DYNAMIC_ROUTING_ARCHITECTURE.md`
See: `docs/TECHNICAL_PITCH_DECK.md`
```

