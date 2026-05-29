# Claim Rewards Account Update Flow

## Goal

SponsorCoinLab displays Sponsor, Recipient, and Agent account records in a relationship tree. When a claim or estimate changes reward state for one account, every affected visible account record must update consistently across the app.

Affected display fields include:

- `rewardsEarned`
- `totalSpCoins`
- `pendingRewards`
- `estimateOffChainSponsorRewards`
- `estimateOffChainRecipientRewards`
- `estimateOffChainAgentRewards`
- `claimOnChainSponsorRewards`
- `claimOnChainRecipientRewards`
- `claimOnChainAgentRewards`
- `claimOnChainTotalRewards`

## Current Status

The reward calculation and tree propagation work is mostly complete.

Completed:

- Claim methods use pre-claim reward inputs plus the claim receipt block timestamp.
- The server returns `__claimedRewardsByAccount` from settlement replay.
- The frontend merges claimed rewards into every affected visible account in the tree.
- Affected pending estimates are set to `0` after a successful claim.
- Expanded relationship branches are preserved during local tree updates.
- Current traces show Sponsor, Recipient, and Agent account records being included in the same update pass.

Still active:

- Account record updates are still tree-driven.
- We are now mirroring those tree-driven updates into a centralized account record store.
- The centralized store is not yet the display source of truth.
- The old tree update path must stay in place until the store path is proven.

## Current Flow

Claim flow:

1. The user expands or runs a claim method from a visible account record.
2. `app/api/spCoin/run-script/route.ts` calls `calculateClaimedRewards` before the on-chain claim.
3. The claim transaction is sent and the receipt block timestamp is read.
4. The server replays the pre-claim formula inputs at the receipt timestamp.
5. The server returns the role claim result plus `__claimedRewardsByAccount`.
6. `usePendingRewardsInlineExpansion.ts` extracts affected accounts from claimed and pending reward maps.
7. `pendingRewardsTreeUtils.ts` merges the reward updates into the existing tree payload.
8. The visible tree is rewritten while preserving expanded branches.
9. The same updated account records are mirrored into `lib/spCoinLab/accountRecordStore.ts`.

Estimate flow:

1. The user expands or reruns an estimate method.
2. The server returns pending reward values and affected account maps.
3. The frontend merges pending reward changes into every affected visible account.
4. The updated tree payload is scanned for affected account records.
5. Matching account records are mirrored into the centralized account record store.

## Important Files

- `app/api/spCoin/run-script/route.ts`
- `app/(menu)/(dynamic)/SponsorCoinLab/hooks/usePendingRewardsInlineExpansion.ts`
- `app/(menu)/(dynamic)/SponsorCoinLab/hooks/useSponsorCoinLabTreeMethods.ts`
- `app/(menu)/(dynamic)/SponsorCoinLab/hooks/pendingRewardsTreeUtils.ts`
- `lib/spCoinLab/accountRecordStore.ts`
- `spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/modules/spCoinReadModule/methods/calculateClaimedRewards.ts`

## Resolved Work

Reward math:

- No delta or correction factor is used.
- Exact claim amounts come from replaying the pre-claim bucket state at the receipt block timestamp.
- Formula traces are still available through `[REWARD_FORMULA_TRACE]`.

Tree propagation:

- Relation wrappers resolve account keys from nested record shapes.
- Object account-key values are ignored so traces do not show `[object object]`.
- Claimed rewards propagate across Sponsor, Recipient, and Agent records.
- Pending estimates are zeroed for all affected visible records after claims.
- Expanded relation branches survive local tree rewrites.

Stability:

- The old tree update path remains active.
- The new account-store path is currently observational and incremental.
- Current validation traces include lines like:

```text
[PENDING_REWARDS_TRACE] auto-sync account records blocks=2 accounts=...
```

The next expected validation marker is:

```text
[ACCOUNT_RECORD_STORE_TRACE] mirror scan source=pendingRewardsTree mirrored=...
```

## Current Incremental Migration

We are moving toward a single account record update system without breaking the existing tree behavior.

Current approach:

1. Keep the existing tree updater as the working source of truth.
2. After the tree payload is updated, scan it for affected `TYPE: "--ACCOUNT--"` records.
3. Mirror those records into `accountRecordStore`.
4. Log mirror counts and field summaries for comparison.
5. Do not render from the store yet.

This lets us compare the new account-store methodology against the known working tree updates before replacing the old system.

## Remaining Work

1. Confirm the mirror trace appears after every claim and estimate update.
2. Verify the mirrored store records match the visible tree records for Sponsor, Recipient, and Agent.
3. Add a small read-only store inspection point or trace summary so store state can be compared without changing UI rendering.
4. Replace targeted tree account refresh logic with store-driven invalidation once the mirror path is trusted.
5. Remove or reduce extra post-claim `getAccountRecord` refresh calls only after the local replay and store mirror cover all required fields.
6. Eventually render account records from the centralized account store instead of rewriting nested tree records directly.

## Known Caveat

The desired final flow avoids extra after-transaction `getAccountRecord` reads. That is not fully true yet. The current incremental implementation can still call `refreshChangedAccountRecords(...)` after non-estimate claim paths.

That refresh remains intentionally for now. It should be removed only after the centralized account-record store is proven to update every affected account correctly.

## Target Final Flow

After any claim or estimate method changes account state:

1. Resolve the affected Sponsor, Recipient, and Agent accounts.
2. Calculate or receive the exact changed reward values.
3. Update the centralized account record store once per affected account.
4. Notify all visible tree locations that reference those accounts.
5. Render every visible account record from the same stored account state.
6. Preserve expanded relationship branches and pending method expansion state.
7. Avoid extra after-transaction `getAccountRecord` reads unless explicitly requested.
