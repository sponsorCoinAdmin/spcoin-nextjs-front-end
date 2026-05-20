SponsorCoinLab Handoff - 2026-05-19

Current Focus

We are cleaning up SponsorCoinLab file size and separating areas of concern, starting with:

app/(menu)/(dynamic)/SponsorCoinLab/hooks/useSponsorCoinLabTreeMethods.ts

The user wants the large hook tamed carefully without changing behavior.

Recent Cleanup Completed

The tree hook was reduced from about 2,235 lines to about 1,778 lines.

Extracted pending rewards helpers into:

app/(menu)/(dynamic)/SponsorCoinLab/hooks/pendingRewardsTreeUtils.ts

This file now owns:

- pending rewards click parsing
- pending rewards method sets/mappings
- lazy pending rewards node helpers
- zero estimate result after successful claim
- pending rewards summary/branch merge helpers
- account record balance/timestamp helpers
- claim balance summary helpers

Extracted shared tree payload utilities into:

app/(menu)/(dynamic)/SponsorCoinLab/hooks/treePayloadUtils.ts

This file now owns:

- JSON payload parsing
- formatted/tree block splitting
- candidate block selection
- readPathValue
- writePathValue
- readDisplayPathValue

Verification

After the extraction, this passed:

npm.cmd run -s typecheck

Important Behavior Context

The latest settled reward behavior is:

When a claim method succeeds, the paired estimate method should be locally set to zero instead of doing a paired estimate RPC call.

Examples:

- claimOnChainTotalRewards -> estimateOffChainTotalRewards = 0
- claimOnChainSponsorRewards -> estimateOffChainSponsorRewards = 0
- claimOnChainRecipientRewards -> estimateOffChainRecipientRewards = 0
- claimOnChainAgentRewards -> estimateOffChainAgentRewards = 0

Only do this after a successful claim. Failed claims must not zero estimates.

Do not reintroduce the old paired-estimate RPC refresh, timer delay, readiness polling, or extra post-claim estimate call.

Current File Size State

useSponsorCoinLabTreeMethods.ts is still large at about 1,778 lines.

The main remaining extraction targets are:

1. expandPendingRewardsActionInline
2. expandMasterSponsorListAccountInline
3. metadata/master-account inline expansion
4. server-backed tree method runner
5. tree/header/account read runners

Recommended Next Step

Extract expandPendingRewardsActionInline into a dedicated hook:

app/(menu)/(dynamic)/SponsorCoinLab/hooks/usePendingRewardsInlineExpansion.ts

This should be the next biggest cleanup, but it is more delicate than the utility extraction because it touches:

- claim vs estimate execution
- account refresh replacement
- paired estimate zeroing
- formatted/tree display patching
- pending rewards branch preservation

Keep this as a behavior-preserving extraction. Do not change reward behavior while moving it.

Likely Dependency Inputs For The New Hook

The extracted hook/function will likely need a params object containing:

- appendLog
- appendWriteTrace
- callAccessMethod
- coerceParamValue
- executeWriteConnected
- ensureReadRunner
- formatFormattedPanelPayload
- loadAccountRecordForAddress
- mode
- normalizeAddressValue
- readCacheNamespace
- requireContractAddress
- runServerBackedTreeSpCoinMethod
- selectedHardhatAddress
- setFormattedOutputDisplay
- setStatus
- setTrackedTreeOutputDisplay
- stringifyResult
- treeAccountRecordCacheRef
- treeOutputDisplayRef
- formattedOutputDisplayRef
- useLocalSpCoinAccessPackage
- useReadCache

Worktree Note

At the time of this handoff, an unrelated file was already modified:

resources/data/spCoinLab/methodMemberLists.json

Do not touch or revert it unless the user asks.

Style / User Preference

Keep updates short. The user wants cleanup progress, not a broad redesign. Make one safe extraction at a time and typecheck after each pass.
