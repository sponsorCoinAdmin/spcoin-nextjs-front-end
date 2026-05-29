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

The reward calculation, tree propagation, and first account-store migration checkpoint are working.

Completed:

- Claim methods use pre-claim reward inputs plus the claim receipt block timestamp.
- The server returns `__claimedRewardsByAccount` from settlement replay.
- The frontend merges claimed rewards into every affected visible account in the tree.
- Affected pending estimates are set to `0` after a successful claim.
- Expanded relationship branches are preserved during local tree updates.
- Current traces show Sponsor, Recipient, and Agent account records being included in the same update pass.
- Updated visible account records are mirrored into `accountRecordStore`.
- Mirror scans compare the store summary against the updated tree summary and currently report `compare=match`.
- Clean post-claim paths now skip the old forced account-record refresh when the mirror covers every affected account.

Still active:

- Account record updates are still tree-driven.
- We are mirroring those tree-driven updates into a centralized account record store.
- The centralized store is not yet the display source of truth.
- The old tree update path must stay in place until visible rendering can safely read from the store.

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
- The new account-store path is currently mirrored and compared against the tree.
- Current validation traces include lines like:

```text
[PENDING_REWARDS_TRACE] auto-sync account records blocks=2 mirrored=13 compare=match matched=13 mismatched=0 refresh=skip-mirror-match ...
```

Estimate paths use the same mirror scan without a post-claim refresh decision:

```text
[PENDING_REWARDS_TRACE] auto-sync account records blocks=2 mirrored=13 compare=match matched=13 mismatched=0 refresh=not-applicable-estimate ...
```

## Current Incremental Migration

We are moving toward a single account record update system without breaking the existing tree behavior.

Current approach:

1. Keep the existing tree updater as the working source of truth.
2. After the tree payload is updated, scan it for affected `TYPE: "--ACCOUNT--"` records.
3. Mirror those records into `accountRecordStore`.
4. Log mirror counts, matched/mismatched account counts, and the refresh decision.
5. Do not render from the store yet.

This lets us compare the new account-store methodology against the known working tree updates before replacing the old system. The latest traces show the mirror matching the tree and claim refreshes using `refresh=skip-mirror-match` on covered paths.

## Remaining Work

1. Keep the aggregate mirror trace while removing older noisy diagnostics.
2. Centralize the account-record update helper so reward updates write through one path.
3. Replace remaining fallback refresh paths only after mismatch and missing-account scenarios are understood.
4. Sync visible tree nodes from the centralized store instead of treating nested records as independent copies.
5. Eventually render account records from the centralized account store instead of rewriting nested tree records directly.

## Known Caveat

The desired final flow avoids extra after-transaction `getAccountRecord` reads. That is now true for clean claim paths where the mirror scan covers all affected accounts and reports no mismatches.

`refreshChangedAccountRecords(...)` remains as a fallback for missing mirror coverage or store/tree mismatches. It should stay until those failure paths have clearer diagnostics and recovery behavior.

## Target Final Flow

After any claim or estimate method changes account state:

1. Resolve the affected Sponsor, Recipient, and Agent accounts.
2. Calculate or receive the exact changed reward values.
3. Update the centralized account record store once per affected account.
4. Notify all visible tree locations that reference those accounts.
5. Render every visible account record from the same stored account state.
6. Preserve expanded relationship branches and pending method expansion state.
7. Avoid extra after-transaction `getAccountRecord` reads unless explicitly requested.
