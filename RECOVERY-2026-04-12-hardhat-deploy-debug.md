# Recovery Pickup: 2026-04-12 HardHat Deploy Debug

## Current Situation

We confirmed two separate issues and resolved one of them:

1. `SponsorCoinLab` was still trusting stale deployment-map addresses after the HardHat server was rolled back.
2. The actual `SPCoin` deployment flow is currently failing before broadcast.

The stale-address issue is fixed.
The deploy failure is still open.

## What We Proved

### 1. HardHat reads were failing because the app was pointing at a stale contract address

After the HardHat server was reset, standard reads failed like:

- `getAccountList`
- `getAccountListSize`

with:

- `BAD_DATA`
- `could not decode result data`

This matched the pattern where the UI still held an old deployment-map address, but the current HardHat chain no longer had contract bytecode at that address.

### 2. SponsorCoinLab now validates HardHat deployment-map entries against on-chain bytecode

File changed:

- `app/(menu)/(dynamic)/SponsorCoinLab/hooks/useSponsorCoinLabNetwork.ts`

Behavior now:

- for chain `31337`, deployment-map entries are validated with `provider.getCode(address)`
- entries with no bytecode are removed from `sponsorCoinVersionChoices`
- if the currently selected HardHat contract has no code after reset, the lab switches to a valid fallback or clears the address

Result:

- the stale version entry cleared correctly after the HardHat rollback

### 3. The real deploy failure is pre-broadcast

Deployment attempts for `V0` failed with:

- `Status 500`
- `execution reverted (no data present; likely require(false) occurred)`
- `action="estimateGas"`

User also verified with `hhblock` that the HardHat block number did not advance before/after deployment attempt.

That means:

- the RPC is reachable
- but no deployment transaction is being mined
- the failure happens during `estimateGas`, before broadcast

### 4. The RPC in use is known

Both frontend and server deploy route are using:

- `https://rpc.sponsorcoin.org/f5b4d4b4a2614a540189b979d068639c3fd44bbb1dfcdb5a`

Confirmed from:

- `.env.local`
  - `NEXT_SERVER_HARDHAT_RPC_URL`
  - `NEXT_PUBLIC_HARDHAT_RPC_URL`

## Deployment Status UI Work Already Done

File changed:

- `app/(menu)/(dynamic)/SpCoinAccessController/hooks/useSpCoinAccessController.ts`

Improvements made:

- status box now starts with:
  - `Deployment of <TokenName> started at <DateTime>`
- same pattern added for `Generate ABI`
- deploy/ABI status is protected from being overwritten mid-run by READY guidance
- added pinned-status behavior so operation results are not immediately stomped by guidance while the same input set is active

Note:

There was still user feedback that final text could appear replaced by READY in some cases earlier in the session. The main overwrite paths were guarded, but if this still reappears, continue inspecting the guidance/status reset effects in `useSpCoinAccessController.ts`.

## Contract / Delete-Tree Work Already Done

### On-chain rename

Changed:

- `deleteAgentSponsorship(...)` -> `unSponsorAgent(...)`

Solidity file:

- `spCoinAccess/contracts/spCoin/accounts/UnSubscribe.sol`

App-side callers were updated accordingly.

### Debugging style

Hardhat `console.log` was attempted first but the compile path rejected the overloads.
Debugging was switched to Solidity events instead.

### Important tree-delete conclusion

Earlier confusion about leftover agent accounts was narrowed down:

- direct chain checks showed deleted agent state was actually gone on-chain
- apparent leftover bare address behavior was likely from app-side serialization / read hydration, not surviving contract state

## Files Changed This Session

### HardHat deployment-map validation

- `app/(menu)/(dynamic)/SponsorCoinLab/hooks/useSponsorCoinLabNetwork.ts`

### Deployment-map live refresh / event plumbing

- `app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/shared/spCoinAbi.ts`
- `app/api/spCoin/access-manager/route.ts`
- `app/(menu)/(dynamic)/SponsorCoinLab/hooks/useSponsorCoinLabNetwork.ts`
- `app/(menu)/(dynamic)/SpCoinAccessController/hooks/useSpCoinAccessController.ts`

### Agent rename / event debug

- `spCoinAccess/contracts/spCoin/accounts/UnSubscribe.sol`
- `app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/shared/spCoinAccessIncludes.ts`
- `app/api/spCoin/run-script/route.ts`
- `app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/serializationTests/index.ts`
- `app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/spCoin/write/defs/deleteAgentSponsorship.ts`
- `app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/spCoin/write/defs/index.ts`
- `app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/spCoin/write/index.ts`
- `app/(menu)/(dynamic)/SponsorCoinLab/components/MethodsPanelCard.tsx`
- `app/(menu)/(dynamic)/SponsorCoinLab/components/SpCoinWriteController.tsx`

### Backup method / read improvements

- `app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/serializationTests/index.ts`
- `app/(menu)/(dynamic)/SponsorCoinLab/hooks/useSponsorCoinLabMethods.ts`
- `app/(menu)/(dynamic)/SponsorCoinLab/components/MethodsPanelCard.tsx`
- `app/(menu)/(dynamic)/SponsorCoinLab/SponsorCoinLabController/SponsorCoinLabController.tsx`
- `app/(menu)/(dynamic)/SponsorCoinLab/components/OutputResultsCard.tsx`
- `spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/modules/spCoinReadModule/methods/getRecipientRateList.ts`

## Most Important Open Problem

### Deployment still fails during `estimateGas`

Relevant file:

- `app/api/spCoin/access-manager/route.ts`

Current deploy path:

- `handleDeploy(...)`
- `deploySpCoinToChain(...)`
- `compileSpCoinContract(...)`
- `new ContractFactory(...)`
- `factory.deploy(normalizeSpCoinContractVersion(...))`

Observed behavior:

- RPC health check succeeds
- block number is readable
- constructor deployment still reverts during `estimateGas`
- no block increment

## Important Code Observations

### Constructor itself does not obviously reject `V0`

File:

- `spCoinAccess/contracts/spCoin/SPCoin.sol`

Constructor:

- accepts `string memory initialVersion`
- if empty, defaults to `defaultVersion`
- otherwise uses the supplied version
- sets:
  - `version`
  - `name`
  - `symbol`
  - `decimals`
  - `balanceOf[msg.sender]`
  - `totalSupply`
  - `totalBalanceOf`

So this does **not** look like a direct “V0 is invalid” issue.

## Best Next Step When Resuming

Instrument the deploy route in:

- `app/api/spCoin/access-manager/route.ts`

Specifically add step-level diagnostics around:

1. `handleDeploy(...)` entry
2. resolved network info
3. signer/deployer address
4. compile complete
5. ABI/bytecode presence and bytecode length
6. explicit constructor args passed to deploy
7. an `estimateGas`/deploy preparation step before `factory.deploy(...)`
8. caught error details with as much structured context as possible

Goal:

- determine whether the revert is caused by constructor/runtime initialization, bytecode/size issues, or node-specific behavior on the HardHat RPC

## Quick Resume Checklist

When returning:

1. Open this file.
2. Re-check current HardHat RPC block with `hhblock`.
3. Confirm SponsorCoinLab still clears stale deployment-map entries after reset.
4. Instrument `app/api/spCoin/access-manager/route.ts` deploy path.
5. Re-run one deployment attempt and capture the new step-level failure point.

