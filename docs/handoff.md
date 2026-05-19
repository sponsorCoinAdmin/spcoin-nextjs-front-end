SponsorCoinLab Handoff - 2026-05-18

Context

The user stopped the prior attempts because too much time was spent exploring and proposing broad fixes. The next pass must stay narrow. Do not redesign the console tree, localStorage state, cache architecture, or branch persistence while handling the current bug.

Current Issue

In SponsorCoinLab Console Display, inside:

result.pendingRewards

there are paired methods:

- estimateOffChainSponsorRewards
- claimOnChainSponsorRewards

When claimOnChainSponsorRewards is clicked/executed, the claim result updates, but the already-visible estimateOffChainSponsorRewards summary stays stale.

Expected Behavior

If estimateOffChainSponsorRewards is already present/open/loaded in the same pendingRewards branch, then after claimOnChainSponsorRewards completes, estimateOffChainSponsorRewards should refresh and display the new estimate value.

The branch open/closed state must not be reset by this refresh.

Simple Intended Fix

After claimOnChainSponsorRewards completes successfully:

1. Run the paired estimate method:
   estimateOffChainSponsorRewards

2. Merge only that refreshed estimate node/value back into the existing pendingRewards branch.

3. Preserve the existing tree branch state.

4. Do not replace the whole getAccountRecord tree.

5. Do not collapse/expand branches unless the user clicked that branch manually.

Scope

For now, handle the sponsor pair only unless the same nearby code already has a clean generic mapping:

- claimOnChainSponsorRewards -> estimateOffChainSponsorRewards

If making the generic mapping is simple and local, the natural full mapping is:

- claimOnChainTotalRewards -> estimateOffChainTotalRewards
- claimOnChainSponsorRewards -> estimateOffChainSponsorRewards
- claimOnChainRecipientRewards -> estimateOffChainRecipientRewards
- claimOnChainAgentRewards -> estimateOffChainAgentRewards

But do not turn this into a larger refactor.

Likely File

app/(menu)/(dynamic)/SponsorCoinLab/hooks/useSponsorCoinLabTreeMethods.ts

Likely Existing Helpers

The file already has pending rewards helpers and method lists:

- PENDING_REWARDS_ESTIMATE_METHODS
- PENDING_REWARDS_CLAIM_METHODS
- PENDING_REWARDS_METHOD_KEYS
- mergePendingRewardsBranchForAccountRefresh
- mergePendingRewardsSummaryNode
- writePendingRewardsPathValue
- loadPendingRewardsEstimate
- claimPendingRewards

Likely Implementation Shape

In the pending rewards click handler, after claimPendingRewards returns, determine the paired estimate method. If the paired estimate node is already loaded in the existing pendingRewards branch, call loadPendingRewardsEstimate with that paired method and merge the returned result into the same branch.

The important part is to update:

estimateOffChainSponsorRewards: "<new value>"

without changing the user's branch state.

Do Not Do

- Do not add a new localStorage system.
- Do not change branch persistence.
- Do not change the cache design.
- Do not modify Solidity.
- Do not change Hardhat scripts.
- Do not broadly refactor the Console Display.
- Do not chase unrelated formatting issues.
- Do not add tracing unless the minimal fix cannot be verified.

Verification

Run:

npm.cmd run -s typecheck

Manual verification expected by the user:

1. Open pendingRewards.
2. Open estimateOffChainSponsorRewards.
3. Click claimOnChainSponsorRewards.
4. Confirm claimOnChainSponsorRewards updates.
5. Confirm estimateOffChainSponsorRewards also updates.
6. Confirm estimateOffChainSponsorRewards remains open if it was open.

Tone / User State

The user is frustrated because previous attempts burned usage without making the simple requested change. Keep updates short. Do not over-explain. Do the smallest useful change and report exactly what changed.
