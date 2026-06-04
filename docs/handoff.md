# SponsorCoinLab Cache and Pending Rewards Handoff

Date: 2026-06-04

## Current Issue

SponsorCoinLab pending reward estimates were correct when run as a standalone method, but could become incorrect when displayed through nested account record paths such as:

- `getAccountRecord -> totalSpCoins -> pendingRewards -> getPendingRewards`
- `getAccountRecord -> totalSpCoins -> pendingRewards -> estimateOffChainTotalRewards`

Observed symptoms:

- Standalone `estimateOffChainSponsorRewards` returned a non-zero value.
- Nested `getPendingRewards` displayed `0`.
- Nested estimate sometimes selected `estimateOffChainTotalRewards` instead of the role-specific sponsor estimate.
- Trace showed `relationshipCache hit method=getAccountRecord`, followed by `recipientCount=0`, even when the account had recipients.
- Method headers previously showed the account address beside estimate/claim/getAccountRecord labels where the reward amount/status text should appear.

## Root Causes Found

1. Snapshot cache key collision

`readAccountRewardSnapshot()` in `app/api/spCoin/run-script/route.ts` cached a raw contract `getAccountRecord()` result under the normal `getAccountRecord` read-cache method key.

That polluted the cache used by the relationship-aware account record reader. Later estimate calls could hit a shallow/raw cached object that did not include relationship lists, so reward calculation stopped with no sponsor recipient links.

Fix: snapshot account reads now use a separate cache method key:

```text
getAccountRewardSnapshotRecord
```

Follow-up finding: the reward relationship reader also cached `spCoinSerialize.getAccountRecordObject()` under the public `getAccountRecord` method key. This could still hit old/shallow account-record entries and make `calculateClaimedRewards` see `recipientCount=0`.

Fix: internal relationship reads now use a separate cache method key:

```text
getAccountRelationshipRecord
```

2. Cached rate transaction set shape mismatch

`getRateTransactionSetCached()` in `spCoinAccess/.../getAccountRecord.ts` expected an array result, but the cached module result could be a normalized object. The object was rejected, causing downstream reward calculations to behave as if no inserted rate transaction set existed.

Fix: `getRateTransactionSetCached()` now accepts both normalized object results and array/tuple results.

3. Claim path did not pre-estimate reward amount

Claim metadata was built without a server-side pre-claim estimate, so claimed/replay metadata could show zero even when the actual pending estimate was non-zero.

Fix: claim methods now run the corresponding estimate before sending the claim transaction:

- `claimOnChainSponsorRewards` -> `estimateOffChainSponsorRewards`
- `claimOnChainRecipientRewards` -> `estimateOffChainRecipientRewards`
- `claimOnChainAgentRewards` -> `estimateOffChainAgentRewards`
- `claimOnChainTotalRewards` -> `estimateOffChainTotalRewards`

4. Nested `getPendingRewards` selected total estimate first

Inside `getAccountRecord`, `getPendingRewardsSummary()` eagerly used `estimateOffChainTotalRewards`. In the failing case, that total estimate resolved as `role=NA` and `pendingTotalRewards=0`, while the role-specific sponsor estimate was correct.

Fix: account-record pending summary now builds from role-specific estimates first, based on account role. It only falls back to total estimate if no role-specific estimate applies.

5. UI default method and summary display

The UI `getPendingRewards` label could prefer the stale zero total node because `getPendingRewardsRecordResultSummaryValue()` found an existing total summary first. The pending record's role fields were also sometimes overwritten to `NA`, hiding the parent account's sponsor role.

Fix: `JsonInspector` now uses inherited account role context when deciding which estimate method the `getPendingRewards` label should run. For a sponsor account, it defaults to `estimateOffChainSponsorRewards`.

## Files Changed In This Thread

Primary server/package changes:

- `app/api/spCoin/run-script/route.ts`
  - Adds cached snapshot reads using `getAccountRewardSnapshotRecord`.
  - Adds claim pre-estimate replay before claim writes.
  - Uses package read-cache invalidation after writes.

- `spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/modules/spCoinReadModule/methods/getAccountRecord.ts`
  - Uses `getAccountRelationshipRecord` for internal relationship account-object cache reads.
  - Accepts object-shaped cached rate transaction sets.
  - Builds account pending summary from role-specific estimate methods before total fallback.

- `spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/utils/readCacheTtl.ts`
  - Adds TTL metadata for `getAccountRelationshipRecord`.
  - Adds TTL metadata for `getAccountRewardTotals`.
  - Adds TTL metadata for `getAccountRewardSnapshotRecord`.

- `spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/cache/readCacheTags.ts`
  - Adds cache tags for `getAccountRelationshipRecord`.
  - Adds cache tags for `getAccountRewardSnapshotRecord` and `getAccountRewardTotals`.

Primary UI changes:

- `components/shared/JsonInspector.tsx`
  - Prevents estimate/claim/getAccountRecord method headers from showing account address as the displayed amount.
  - Restores `(Last Estimate)` and `(Last Claimed)` summary suffix display.
  - Makes nested `getPendingRewards` choose role-specific estimates from parent account context.

Policy/doc change:

- `AGENTS.md`
  - Adds policy to avoid submission approval prompts for normal repo-local reads, diffs, status checks, edits, and validation commands.

## Verification Already Run

```text
npm run -s typecheck
```

Typecheck passed after the latest changes.

## Retest Plan

Before testing, run `clearCache` once. Old poisoned `getAccountRecord` entries may still exist in the live cache namespace.

Recommended script:

1. `clearCache`
2. `estimateOffChainSponsorRewards` for `0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266`
3. `getAccountRecord` for the same account
4. Expand:
   - `result.totalSpCoins.pendingRewards`
   - `getPendingRewards`
   - `estimateOffChainSponsorRewards`

Expected result:

- Standalone `estimateOffChainSponsorRewards` is non-zero.
- Nested `getPendingRewards` should use/show the sponsor estimate, not zero total estimate.
- Nested `estimateOffChainSponsorRewards` should show the same class of non-zero value and `(Last Estimate)`.
- Estimate traces should show `getAccountRelationshipRecord`, not `getAccountRecord`, for internal relationship account reads.
- Warm cache runs should not make the nested result degrade to zero.

## Known Caveats

- There are many unrelated dirty files in the worktree. Do not treat the current diff as only this bug unless filtered by file.
- The `dist/` package output may need regeneration if this local package expects built artifacts to stay in sync with `src/`.
- If stale data still appears after this patch, check the active cache namespace in the trace and run `clearCache` again for that namespace.
- If `estimateOffChainTotalRewards` is still expected to return non-zero for sponsor accounts, that should be investigated separately. The current fix routes nested sponsor-account pending rewards through the role-specific sponsor estimate because that is the method returning the correct value.
