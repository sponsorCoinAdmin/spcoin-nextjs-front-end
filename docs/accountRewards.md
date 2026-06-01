# Account Rewards Debug Log

## Scope

This document captures the SponsorCoinLab pending-rewards regression, the bitwise role migration, the fixes already implemented, and the remaining work.

Primary UI context:

- `http://localhost:3000/SponsorCoinLab`
- `Step 1 -> getAccountRecord -> result -> getPendingRewards`

Primary symptom:

- Parent row shows:
  - `getPendingRewards "<amount>" (Last Estimate)`
- Child rows are missing summary values:
  - `estimateOffChainSponsorRewards`
  - `claimOnChainSponsorRewards`
- Expected:
  - `estimateOffChainSponsorRewards "<amount>" (Last Estimate)`
  - `claimOnChainSponsorRewards "<amount>" (Last Claimed)` when available

---

## Problem Summary

Two issues overlapped:

1. Role source mismatch in `pendingRewards` payload
   - Account-level role was `"Sponsor"`, but nested `pendingRewards` sometimes resolved to:
     - `roles: "0"`
     - `role: "NA"`
     - `isSponsor: false`, `isRecipient: false`, `isAgent: false`
   - This caused role-sensitive pending-reward method handling to behave as if no role existed.

2. Child summary display fallback mismatch
   - UI summary logic for child method rows relied on:
     - direct method result data, or
     - fallback mapping to parent summary
   - Parent `getPendingRewards` summary was not consistently mapped to child estimate display.
   - Claim fallback matching was overly broad in one branch, then constrained in another, causing inconsistent behavior.

---

## Bitwise Role Migration (Completed)

Role storage moved from string-array roles to bitwise flags.

- `0 = N/A`
- `SPONSOR = 1`
- `RECIPIENT = 2`
- `AGENT = 4`
- Combined roles via OR:
  - `SPONSOR | RECIPIENT = 3`
  - `SPONSOR | AGENT = 5`
  - `RECIPIENT | AGENT = 6`
  - `SPONSOR | RECIPIENT | AGENT = 7`

Implemented in role summary path:

- [getAccountRoleSummary.ts](C:/Users/robin/spCoin/SPCOIN-PROJECT-MODULES/spcoin-nextjs-front-end/spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/modules/spCoinReadModule/methods/getAccountRoleSummary.ts)
- Added `getRoles(account)` and integrated usage in account role summary consumers.

---

## Changes Implemented So Far

### 1) Source-side pendingRewards role derivation hardening

File:

- [getAccountRecord.ts](C:/Users/robin/spCoin/SPCOIN-PROJECT-MODULES/spcoin-nextjs-front-end/spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/modules/spCoinReadModule/methods/getAccountRecord.ts)

What changed:

- `buildTotalSpCoinsRecord(...)` now receives `accountRecord`.
- Pending rewards method set is built using account-level role source, not only nested pending payload.
- Added trace line:
  - `"[PENDING_REWARDS_TRACE] source buildTotalSpCoinsRecord ... roles=... role=... isSponsor=... methods=..."`
- Updated call sites to pass `accountStruct` where needed.

Why:

- Prevent `pendingRewards` from defaulting to role `0/NA` when account-level role is known.

---

### 2) Inline expansion and merge tracing

File:

- [usePendingRewardsInlineExpansion.ts](C:/Users/robin/spCoin/SPCOIN-PROJECT-MODULES/spcoin-nextjs-front-end/app/(menu)/(dynamic)/SponsorCoinLab/hooks/usePendingRewardsInlineExpansion.ts)

What changed:

- Added detailed trace at key pipeline steps:
  - expand start / candidate selection
  - method execution selection (estimate vs claim)
  - expanded node shape
  - summary merge step
  - final payload normalization
- Key trace entries:
  - `step expanded-node ...`
  - `step merge-summary ...`
  - `step final-payload ...`
- Added paired estimate refresh/zeroing trace for claim flows.

Why:

- Identify exactly where data is lost:
  - method result creation,
  - summary merge,
  - normalization,
  - or final tree render.

---

### 3) JsonInspector fallback and method-row trace

File:

- [JsonInspector.tsx](C:/Users/robin/spCoin/SPCOIN-PROJECT-MODULES/spcoin-nextjs-front-end/components/shared/JsonInspector.tsx)

What changed:

- Added method-row click trace with summary diagnostics:
  - direct summary presence
  - fallback summary presence
  - data/result/parent key snapshots
- Added helper summary/fallback trace formatting.
- Added fallback matching for estimate child rows to use parent estimate summaries, including parent `getPendingRewards` summary when appropriate.
- Tightened claim fallback matching to avoid incorrect cross-method claim mapping.

Important current reference lines:

- `getPendingRewardsMethodFallbackSummaryValue(...)` around line `1961`
- `getPendingRewardsMethodTraceSummary(...)` around line `2010`
- method label click trace around line `4037`

---

## Current Known Behavior

From latest user screenshots:

- Parent row is correctly showing `(Last Estimate)`.
- Child rows still intermittently show no value.
- Nested trace output still occasionally shows role state mismatch (`roles: "0"` in some expanded areas).

Interpretation:

- We fixed major pathing and instrumentation, but one merge/display path is still carrying stale or mismatched role/summary state in some runs.

---

## What We Still Have To Do

### A) Resolve remaining stale-role propagation in pending rewards tree

Investigate role state propagation in tree merge helpers, especially when:

- parent account role is known (`Sponsor`)
- nested pending-reward node still carries `roles: 0`

Target area:

- pending rewards tree normalization/merge utilities used by inline expansion and rendering.

Acceptance:

- For a sponsor account, any pending-rewards branch relevant to sponsor methods must not present as role `NA/0` during summary render.

---

### B) Guarantee child summary labels always inherit usable estimate/claim values

For each child method row under `getPendingRewards`:

- `estimateOffChain*Rewards` displays `(Last Estimate)` when parent or child has an estimate result.
- `claimOnChain*Rewards` displays `(Last Claimed)` when claim result is present.

Acceptance:

- Child row labels always show value text after method execution in same session payload.

---

### C) Verify no path still uses deprecated array-role assumptions

Role consumers must support bitwise roles consistently:

- numeric `roles` (0..7) and derived booleans
- display role text (`Sponsor`, `Recipient`, `Agent`, `NA`)

Acceptance:

- No mixed logic where one path expects `roles: Array<'sponsor'|'recipient'|'agent'>` and another emits numeric roles.

---

## Step-by-Step Trace Checklist

Use this order every run:

1. Trigger `getAccountRecord` for known sponsor account.
2. Confirm source role trace:
   - `source buildTotalSpCoinsRecord ... roles=1 role=Sponsor isSponsor=true`
3. Expand `getPendingRewards`.
4. Click `estimateOffChainSponsorRewards`.
5. Inspect expansion traces in order:
   - `step expanded-node ...`
   - `step merge-summary ...`
   - `step final-payload ...`
6. Click method label and inspect:
   - `method label click ... hasSummary=... hasResultSummary=... summary=...`
   - check `dataKeys`, `resultKeys`, `parentKeys`, `direct`, `fallback`.
7. Validate UI label text:
   - child estimate row includes value + `(Last Estimate)`.
8. Repeat for `claimOnChainSponsorRewards` and verify `(Last Claimed)`.

---

## Definition of Done

Issue is complete when all are true:

1. Sponsor account role remains consistent across account root and pending-rewards nested branches.
2. Child estimate and claim rows always show their summary values after execution.
3. No `roles: "0"` / `role: "NA"` appears in sponsor pending-rewards display path unless account truly has no role.
4. Trace logs confirm stable data through source -> merge -> final payload -> render.

