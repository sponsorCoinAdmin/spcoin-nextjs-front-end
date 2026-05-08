# Off-Chain Staking Rewards Design

## Purpose

This document captures the current staking rewards optimization issue and the proposed design direction.

The goal is to reduce unnecessary RPC/on-chain read pressure for staking reward previews while keeping Solidity as the canonical source for reward settlement writes.

## Current Understanding

Staking rewards have two different use cases:

1. **Read preview**
   - Used by the UI and access library to show pending rewards.
   - Does not mutate token state.
   - Can be calculated off-chain from raw chain state and/or cache.

2. **Write settlement**
   - Used by methods such as `updateAccountStakingRewards`.
   - Mutates balances, account reward totals, and related staking reward records.
   - Must remain on-chain because Solidity state changes must be canonical and verifiable.

The project already has an off-chain pending reward calculation path in:

`spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/modules/spCoinReadModule/methods/getPendingAccountStakingRewards.ts`

That method calculates:

- `pendingSponsorRewards`
- `pendingRecipientRewards`
- `pendingAgentRewards`
- aggregate `pendingRewards`

So the pending rewards math for reads is already outside Solidity. However, the method still gathers source data from the chain through RPC reads.

## Current Read Path

The current exposed method is:

`getPendingAccountStakingRewards(accountKey)`

It returns all reward categories in one result:

```json
{
  "TYPE": "--PENDING_ACCOUNT_STAKING_REWARDS--",
  "accountKey": "0x...",
  "calculatedAt": "2026-...",
  "calculatedAtTimestamp": "...",
  "pendingRewards": "...",
  "pendingSponsorRewards": "...",
  "pendingRecipientRewards": "...",
  "pendingAgentRewards": "..."
}
```

Internally, the off-chain calculation still reads state such as:

- inflation rate
- account record / account links
- sponsor keys
- recipient keys
- parent recipient keys
- recipient rate lists
- recipient rate agent lists
- agent rate lists
- recipient rate transaction sets
- agent rate transaction sets
- block timestamp

These are not reward calculations in Solidity, but they are still RPC calls to retrieve the data needed for the off-chain calculation.

## Current Write Path

The write path must remain Solidity-driven.

Examples:

- `updateAccountStakingRewards`
- reward settlement
- balance/reward total mutation
- transaction/reward record mutation

These writes must keep using Solidity calculations or Solidity-verified state transitions because they change token state. The off-chain read calculation can preview expected deltas, but it must not replace on-chain settlement logic.

## Problem

The current off-chain read calculation reduces Solidity calculation dependency for previews, but it still creates many RPC reads.

Observed examples from lab runs:

- `getPendingAccountStakingRewards` often uses around `10` on-chain calls.
- `getAccountRecord` often uses around `14` on-chain calls because it hydrates linked recipient/agent data and pending reward summaries.
- `updateAccountStakingRewards` improved to around `5` calls around the write, but still needs pre/post verification reads for lab diagnostics.

This means the project has not yet achieved the full benefit of moving reads off-chain:

- RPC load remains higher than desired.
- Repeated read calls can still stress the RPC/nginx/Hardhat EC2 path.
- Token bytecode does not shrink until Solidity read/helper functions are removed or simplified.
- The cache improves repeated reads, but first reads and cache misses still walk the chain heavily.

## Design Direction

The intended architecture is:

1. Solidity remains canonical for writes.
2. Off-chain library calculates read previews.
3. Cache is the default access path for all read methods.
4. On-chain events invalidate or refresh cached data.
5. UI methods expose a `Cache` checkbox defaulted on for diagnostics.
6. Cache bypass is explicit and should be used only for verification/debugging.

## Proposed Refactor

### 1. Split pending reward calculations by role

Currently the library exposes one aggregate method. We should add role-specific methods:

- `getPendingSponsorRewards(accountKey)`
- `getPendingRecipientRewards(accountKey)`
- `getPendingAgentRewards(accountKey)`

Then keep:

- `getPendingAccountStakingRewards(accountKey)`

as an aggregate wrapper that calls the three role-specific calculations.

This makes it easier to:

- test each reward path independently
- profile each path independently
- cache role-specific results
- identify which raw data each role actually needs
- eventually remove unused Solidity read helpers with more confidence

### 2. Separate raw state reads from reward math

The pending reward module should be structured around two layers:

- raw data access layer
- pure calculation layer

Example shape:

```ts
const graph = await loadRewardGraph(accountKey, options);
const sponsorRewards = calculatePendingSponsorRewards(graph, timestamp);
const recipientRewards = calculatePendingRecipientRewards(graph, timestamp);
const agentRewards = calculatePendingAgentRewards(graph, timestamp);
```

The pure calculation functions should be deterministic and testable without RPC.

### 3. Make graph/state cache explicit

The reward calculation needs relationship/rate/transaction-set state. That state should be cached as reusable graph data, not repeatedly fetched per method.

Candidate cache entries:

- account record shallow
- account links
- sponsor-to-recipient rates
- recipient rate transaction set
- recipient rate agent list
- agent rate list
- agent rate transaction set
- inflation rate

Cache keys should include:

- chain id
- contract address
- method/data type
- account/sponsor/recipient/agent/rate identifiers
- optional block/timestamp scope if needed

### 4. Use events to invalidate cache

Writes should invalidate affected cached reads.

At minimum, invalidation should happen around:

- account creation/update
- sponsor/recipient relationship changes
- recipient rate changes
- agent rate changes
- transaction set updates
- staking reward settlement
- inflation rate updates

The current read cache has method/account dependency indexing. This should be expanded so relationship and transaction-set data can be invalidated precisely.

### 5. Preserve explicit bypass for diagnostics

The UI `Cache` checkbox should remain default-on.

When unchecked, the access path may bypass cache to verify chain truth. This is useful for lab/debugging, but should not be the normal production path.

## Solidity Impact

No Solidity changes are required just to split and cache off-chain reads.

Solidity changes become relevant when we want bytecode reduction.

Candidates to remove or simplify later:

- Solidity read/helper methods used only for preview calculations.
- Serialized reward/account read helpers that duplicate library-side formatting.
- On-chain methods that calculate pending rewards for UI display only.

Methods that must remain:

- state-mutating reward settlement methods
- raw state required for canonical settlement
- primitive getters required by the library unless replaced by public mappings/events
- events needed for cache invalidation

The guiding rule:

**Reads can be previewed off-chain. Writes must settle on-chain.**

## Proposed Implementation Order

1. Refactor `getPendingAccountStakingRewards.ts` into reusable role-specific calculation functions.
2. Add access methods:
   - `getPendingSponsorRewards`
   - `getPendingRecipientRewards`
   - `getPendingAgentRewards`
3. Add JSON method definitions so each can be tested in SponsorCoinLab.
4. Add trace/profiling metadata to show:
   - cache hits/misses
   - raw RPC reads
   - role path executed
5. Build a small parity run:
   - preview pending rewards off-chain
   - run `updateAccountStakingRewards`
   - compare off-chain settlement timestamp preview with on-chain delta
6. Expand cache invalidation for relationship/rate/transaction-set data.
7. After parity is stable, identify Solidity read helpers that can be removed.
8. Run contract size comparison before and after Solidity cleanup.

## Open Questions

- Which current Solidity view methods are only used for UI/read previews?
- Are all required raw state values available through smaller primitive getters?
- Should the cache be process-local only, or backed by a persistent store for the deployed Next.js instance?
- Which events currently exist for invalidation, and which new events are needed?
- Should reward previews be scoped to latest block, pending block, or explicit settlement timestamp by default?
- How long should volatile values like latest block timestamp and inflation rate stay cached?

## Current Recommendation

Do not remove Solidity settlement logic.

Do refactor the off-chain read module now so sponsor, recipient, and agent pending reward calculations are independently callable and independently cacheable.

Then measure again:

- first-read RPC call count
- warmed-cache RPC call count
- `getAccountRecord` call count
- `getPendingAccountStakingRewards` call count
- write comparison accuracy

Only after the off-chain path is stable should we remove Solidity read/helper code for bytecode reduction.
