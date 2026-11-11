# Stage 3 Tracing Tasks: Cost & Latency Optimization

These tracing tasks allow you to trace latency savings, cache hits, and routing choices under simulated enterprise traffic.

## Tracing Task 3.1: L1 Exact Cache Hit Lifecycle
- **Goal:** Trace an exact match returning in <1ms at $0 cost.
- **Trace Points:**
  1. Submit query: "What is our customer support email?".
  2. Record downstream model call duration and cost receipt.
  3. Submit identical query a second time.
  4. Trace L1 lookup by SHA-256 digest.
  5. Verify cache hit flag is true, network latency is 0ms, and cost is $0.00.

---

## Tracing Task 3.2: L2 Semantic Cache Hit on Paraphrase
- **Goal:** Trace cosine similarity matching across differently phrased queries.
- **Trace Points:**
  1. Prime cache with: "Who founded the Stripe payment company?".
  2. Query with paraphrase: "Can you tell me the founders of Stripe?".
  3. Observe L1 miss (hashes differ).
  4. Trace L2 vector embedding cosine similarity computation.
  5. Confirm similarity exceeds threshold ($\ge 0.88$).
  6. Verify response returned from semantic cache without downstream LLM call.

---

## Tracing Task 3.3: Dynamic Model Routing Decisions
- **Goal:** Trace routing classification between Economy and Frontier tiers.
- **Trace Points:**
  1. Inbound query: "Is the user active?" (Low complexity).
  2. Trace classifier rule: token count $< 20$, no complex reasoning tokens.
  3. Verify route selected: Economy model (`gemini-1.5-flash` at $0.075/1M).
  4. Inbound query: "Analyze the architectural differences between Paxos and Raft consensus protocols."
  5. Trace classifier rule: complex reasoning keywords detected.
  6. Verify route selected: Frontier model (`gemini-1.5-pro` at $3.50/1M).
