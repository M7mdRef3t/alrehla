# Dawayir Live Agent - Technical Pitch Deck

## Slide 1 - Title
**Dawayir Live Agent: Dynamic Recovery Routing at Runtime**  
Tagline: *Recovery is not magic. Recovery is adaptive computation.*

Speaker note:
- We replaced static "learning paths" with a live routing system that adapts every session.
- This is a production-grade architecture with telemetry, intervention, and load gates.

## Slide 2 - Problem (First Principles)
**Static paths fail under human variability.**
- Human state changes minute by minute.
- Fixed sequences ignore cognitive overload and hesitation.
- New content breaks static path design and requires manual curation.

Speaker note:
- Input state is dynamic, so routing must be dynamic.
- We model the problem as: current state + target state + best next action.

## Slide 3 - Paradigm Shift
**From static pathing to dynamic routing (GPS model).**
- Content is modeled as graph nodes and edges.
- Routing is calculated per request, per context.
- New content joins the graph without rewriting user journeys.

Speaker note:
- We route users, not pages.
- The graph is the infrastructure; policy and swarm are runtime intelligence.

## Slide 4 - Core Architecture
**Three-layer engine**
1. Graph + metadata layer (knowledge nodes/edges, cognitive load metadata).  
2. Swarm learning layer (success/failure signals with exploration).  
3. Live intervention layer (real-time rescue before drop-off).

Speaker note:
- This creates a closed feedback loop: decide -> observe -> learn -> intervene.

## Slide 5 - Anti-Echo Chamber Design
**Exploration vs exploitation by design.**
- Epsilon-greedy exploration fixed at 15%.
- Time-decay on old edge performance.
- New content gets guaranteed exposure and measurable traction.

Speaker note:
- The system cannot get stuck in one successful historical path.

## Slide 6 - Zero-DB Hot Path
**Fast path is DB-light and cache-first.**
- Precompute worker builds candidate cache every 1-3 hours.
- `next-step-v2` reads precomputed cache instead of K-hop runtime traversal.
- Client-injected recent telemetry enables O(1) context refinement in memory.

Speaker note:
- We keep Postgres as source of truth, not a runtime bottleneck.

## Slide 7 - Real-Time Intervention
**Active Intervention Protocol**
- Idle-aware telemetry tracks active time, hesitation, and micro-interactions.
- Threshold watcher detects silent paralysis (high load + high hesitation).
- Immediate intervention prompt triggers breathing micro-action before drop-off.

Speaker note:
- We do not wait for completion to react.
- This is proactive support, not retroactive analytics.

## Slide 8 - Reliability and Fallback
**Safe-by-default runtime**
- Feature flag: `dynamic_routing_v2` for gradual rollout.
- Automatic fallback to existing recommendation policy when cache is unavailable.
- No behavior regression when feature flag is OFF.

Speaker note:
- We can ship fast without breaking baseline product reliability.

## Slide 9 - Observability (Owner Dashboard)
**Day-1 telemetry that explains behavior**
- Fallback rate, exploration share, completion split (explore vs exploit).
- Cognitive matrix: capacity band x selected load x completion.
- Latency quality: noise filtered percent (raw vs active time).
- Intervention health: total interventions and per-segment intervention rate.

Speaker note:
- The dashboard does not just show KPIs; it explains system decisions.

## Slide 10 - Scale Validation
**Concurrency and stress testing**
- Routing load test and CI load gate added.
- Build fails automatically if latency/error thresholds are violated.
- Quality gates include p95 and max error rate limits.

Speaker note:
- This is enterprise behavior under pressure, not a demo-only system.

## Slide 11 - Innovation Summary
**Why this is technically novel**
- Dynamic graph routing for behavioral recovery workflows.
- Swarm reinforcement with anti-echo safeguards.
- Real-time cognitive rescue loop with zero-DB intervention trigger path.
- Continuous quality enforcement via CI load gates.

Speaker note:
- The product is adaptive by architecture, not by manual tuning.

## Slide 12 - Closing
**Dawayir Live Agent is a self-improving adaptive system.**
- Detects state.
- Routes next best action.
- Intervenes before failure.
- Learns from outcomes.

Final line:
*We turned recovery from static content delivery into live adaptive infrastructure.*

---

## Appendix A - Demo Sequence (3 minutes)
1. Show a normal `next-step-v2` decision in dashboard.  
2. Trigger hesitation scenario and show intervention prompt.  
3. Show `intervention-trigger` event and segment metrics update.  
4. Show load-gate output proving p95 and error guardrails.

For a short competition cut, use: `docs/DEMO_STORYBOARD_60S.md`.

## Appendix B - Suggested KPI Targets
- Fallback rate: <= 5%  
- Exploration share: 10-20%  
- Intervention response time (UI): < 1s  
- `next-step-v2` p95: <= 900ms  
- `outcome-v2` p95: <= 700ms  
- Error rate under load: <= 2%
