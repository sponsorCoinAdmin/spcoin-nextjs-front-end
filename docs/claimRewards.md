# Claim Rewards Update Flow

## Goal

SponsorCoinLab displays a Sponsor, Recipient, and Agent relationship tree. When any claim method is called from one account, the UI must update every affected visible account in that relationship.

The affected display fields include:

- `rewardsEarned`
- `totalSpCoins`
- `getPendingRewards`
- estimate methods:
  - `estimateOffChainSponsorRewards`
  - `estimateOffChainRecipientRewards`
  - `estimateOffChainAgentRewards`
- claim methods:
  - `claimOnChainSponsorRewards`
  - `claimOnChainRecipientRewards`
  - `claimOnChainAgentRewards`
  - `claimOnChainTotalRewards`

## Current Architecture

Claims now use a pre-claim calculation plus receipt-timestamp replay:

1. Call `calculateClaimedRewards` before the claim and preserve bucket inputs.
2. Execute the on-chain claim.
3. Read the claim receipt block timestamp.
4. Replay the pre-claim formula trace at that settlement timestamp.
5. Merge the replayed claim map into the tree.
6. Clear affected pending estimates.
7. Preserve expanded relationship branches.

Important files:

- `app/api/spCoin/run-script/route.ts`
- `app/(menu)/(dynamic)/SponsorCoinLab/hooks/usePendingRewardsInlineExpansion.ts`
- `app/(menu)/(dynamic)/SponsorCoinLab/hooks/useServerBackedTreeSpCoinMethod.ts`
- `app/(menu)/(dynamic)/SponsorCoinLab/hooks/pendingRewardsTreeUtils.ts`
- `spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/modules/spCoinReadModule/methods/calculateClaimedRewards.ts`

## Implemented Work

`calculateClaimedRewards` is the offline source for claimed reward propagation and formula trace input capture.

The frontend has local update helpers in `pendingRewardsTreeUtils.ts`:

- `updateAccountClaimedRewards`
- `updateAccountPendingEstimate`
- `updateAccountRewardsEarned`
- `mergeClaimedRewardsByAccountIntoTree`

The server-backed claim route now uses the final replay flow:

1. Call `calculateClaimedRewards` before the claim and preserve formula trace inputs.
2. Execute the on-chain claim.
3. Read the claim receipt block timestamp.
4. Replay the pre-claim formula trace with the receipt block timestamp.
5. Return `__claimedRewardsByAccount` from that replay for local tree updates.

## Resolved Issues

After-transaction diagnostic reads have been removed from the final claim path, so a transient RPC failure after a successful transaction cannot turn the claim result into a failure.

Tree merge fixes:

- relation wrappers resolve account keys from `record[0]` and `record.value`,
- preserved relation branches are recursively merged,
- object values are ignored by account-key normalization so trace output does not show `[object object]`,
- claimed rewards and zeroed pending estimates propagate to every affected visible account.

## Current Status

The replay calculation has been proven against temporary account-record diagnostics for Sponsor, Recipient, and Agent.

We are not adding a random delta or correction factor. The exact match comes from using the pre-claim bucket state with the claim receipt block timestamp.

## Validation Trace

During validation, temporary comparison traces confirmed the receipt-timestamp replay exactly matched the on-chain claim results. Those extra diagnostics are no longer part of the final flow.

The route still requests formula tracing from `calculateClaimedRewards` and prints `[REWARD_FORMULA_TRACE]` lines.

Each formula line includes:

- reward kind: `recipient` or `agent`
- Sponsor, Recipient, and Agent keys
- recipient and agent rates
- `totalStaked`
- `lastUpdate`
- calculation timestamp
- `timeDiff`
- `yearSeconds`
- computed bucket reward

The formula being validated is:

```text
floor(floor(timeDiff * totalStaked * rate / 100) / yearSeconds)
```

This matches the Solidity formula shape in `RewardsManager.sol`:

```solidity
uint256 timeRateMultiplier = ( timeDiff * _stakedSPCoins * _rate ) / 100;
rewards = timeRateMultiplier / year;
```

## Final Test Result

The Agent claim replay matched all affected accounts exactly:

- Sponsor: `deltaMinusSettlementReplay=0`
- Recipient: `deltaMinusSettlementReplay=0`
- Agent: `deltaMinusSettlementReplay=0`

Extra after-transaction diagnostic reads were removed after this proof.

## Desired Final Flow

After any claim method is called from Sponsor, Recipient, or Agent:

1. Resolve all affected accounts in the Sponsor/Recipient/Agent relationship.
2. Calculate exact claimed rewards offline using the same inputs as the on-chain claim.
3. Update each visible account record locally.
4. Add claimed amounts into `rewardsEarned`.
5. Set affected pending estimates to `0`.
6. Show the role-specific claim result as `Last Claimed`.
7. Preserve already-expanded relationship branches in the tree.
8. Avoid extra after-transaction `getAccountRecord` reads.
