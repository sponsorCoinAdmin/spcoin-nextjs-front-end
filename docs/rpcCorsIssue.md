# SponsorCoinLab RPC/CORS Trace Handoff

Date: 2026-05-14

## Summary

We were debugging repeated browser RPC/CORS/503 noise in `SponsorCoinLab`, especially around `pendingRewards` and `runPendingRewards`.

The important discovery is that there are two different execution paths:

1. The standalone JSON method `runPendingRewards` can work correctly through the server-backed route.
2. The inline Console Display tree interaction for `pendingRewards` was creating a browser Hardhat `JsonRpcProvider` and issuing browser `eth_call` requests.

The browser requests can hit CORS errors because the browser directly posts to:

```text
https://rpc.sponsorcoin.org/f5b4d4b4a2614a540189b979d068639c3fd44bbb1dfcdb5a
```

The server-backed route does not have the browser CORS problem and is the preferred path for Hardhat RPC work.

## What Was Proven

### Standalone `runPendingRewards` works

Running `runPendingRewards` directly returned a valid result for:

```json
{
  "msg.sender": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "Account Key": "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
  "mode": "Update"
}
```

Successful result shape:

```json
{
  "TYPE": "--ACCOUNT_PENDING_TOTAL_REWARDS--",
  "accountKey": "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
  "pendingRewards": "493,710,162,824,799,944",
  "pendingAgentRewards": "493,710,162,824,799,944",
  "pendingTotalRewards": "493,710,162,824,799,944"
}
```

First run made on-chain calls such as:

- `getInflationRate`
- `getAccountRecord`
- `getAccountLinks`
- `getSponsorRecipientRates`
- `getRecipientRateAgentList`
- `getAgentRateList`
- `getAgentRateTransactionSetKey`
- `getRateTransactionSet`

### Cache re-read works

Immediately re-running the same `runPendingRewards(Update)` returned in about `6ms` with:

```json
{
  "onChainRunTimeMs": "0",
  "onChainCallCount": "0",
  "onChainCalls": {
    "calls": [],
    "totalOnChainMs": 0
  }
}
```

This proves the cache path is still working: first read populates cache, second read hits cache and makes no RPC calls.

## Original Browser/CORS Symptom

The console showed repeated browser RPC activity even when not interacting:

```text
[SPCOIN_RPC_TRACE] browser fetch to RPC
Access to fetch at 'https://rpc.sponsorcoin.org/...' from origin 'http://localhost:3000' has been blocked by CORS policy
POST https://rpc.sponsorcoin.org/... net::ERR_FAILED 503 (Service Temporarily Unavailable)
```

The stack often included:

```text
useSponsorCoinLabNetwork.ts
ethers provider-jsonrpc.js
subscriber-polling.js
subscriber-filterid.js
contract.on(...)
startAccountCacheEventListener
```

That pointed to background event listeners and browser-created ethers providers.

## Account Cache Listener Finding

The account cache event listener subscribed to `TransactionAdded` in the browser:

```ts
typedContract.on('TransactionAdded', handler)
```

Ethers then polls the RPC in the browser, which can trigger CORS and 503 console noise.

Changed file:

```text
spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/utils/accountCacheEventListener.ts
```

Changes made:

- Listener registry moved to `globalThis`.
- `startAccountCacheEventListener` now no-ops in the browser.
- Browser startup calls `stopAllAccountCacheEventListeners()`.

Also added browser cleanup from:

```text
app/(menu)/(dynamic)/SponsorCoinLab/hooks/useSponsorCoinLabNetwork.ts
```

## Central RPC Trace Module

Added a shared tracing module:

```text
app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/shared/spCoinRpcTrace.ts
```

It owns:

- RPC trace line formatting.
- Browser 200-line RPC trace buffer.
- `spcoin-rpc-trace` browser event.
- Browser `fetch` RPC tracer.
- Traced Hardhat `JsonRpcProvider` factory using ethers `FetchRequest`.

Expected trace lines now look like:

```text
[SPCOIN_RPC_TRACE] browser RPC request transport=ethers-fetch-request method=eth_call ...
[SPCOIN_RPC_TRACE] browser RPC response transport=ethers-fetch-request method=eth_call ...
[SPCOIN_RPC_TRACE] server RPC request transport=ethers-fetch-request method=eth_call ...
[SPCOIN_RPC_TRACE] server RPC response transport=ethers-fetch-request method=eth_call ...
```

The tracer was improved to:

- Decode ethers `FetchRequest` JSON-RPC bodies.
- Decode browser `Request` bodies when possible.
- Suppress duplicate lower-level fetch traces when the traced ethers transport already captured the call.

## Server-backed Route Changes

Server-backed route:

```text
app/api/spCoin/run-script/route.ts
```

Changes made:

- Uses `createTracedHardhatJsonRpcProvider`.
- Server RPC traces are pushed into `stepTrace`.
- Successful payloads now include:

```ts
debug: {
  trace: stepTrace
}
```

This lets the UI display server RPC request/response trace lines, not only error traces.

## Method Execution Regression Found

There was a regression where server-backed writes were only enabled when a timing collector existed:

```ts
const payload = executionTimingCollector
  ? await runWithMethodTimingCollector(executionTimingCollector, async () => executeBody(true))
  : await executeBody(false);
```

This meant Trace/timing state could change whether Hardhat spCoin writes used the server path or browser path.

Changed to:

```ts
const payload = executionTimingCollector
  ? await runWithMethodTimingCollector(executionTimingCollector, async () => executeBody(true))
  : await executeBody(true);
```

File:

```text
app/(menu)/(dynamic)/SponsorCoinLab/hooks/useSponsorCoinLabMethodExecution.ts
```

## Inline `pendingRewards` Path

Clicking `pendingRewards` in the Console Display was still creating a browser provider:

```text
[SPCOIN_RPC_TRACE] create browser Hardhat JsonRpcProvider#4
[SPCOIN_RPC_TRACE] browser RPC request ... method=eth_call
```

This was because inline tree expansion in:

```text
app/(menu)/(dynamic)/SponsorCoinLab/hooks/useSponsorCoinLabTreeMethods.ts
```

was calling:

- `runSpCoinReadMethod`
- `runSpCoinWriteMethod`

directly in the browser for pending rewards expansion and refresh actions.

Changed inline pending reward actions to use `/api/spCoin/run-script` in Hardhat mode.

Added helper:

```ts
runServerBackedTreeSpCoinMethod(...)
```

It dispatches:

```text
[SPCOIN_RPC_TRACE] tree server-backed dispatch panel=... method=... mode=...
```

In Hardhat mode it is now used for:

- `pendingRewards` estimate expansion
- `runPendingRewards`
- claim flows
- post-claim `getAccountStakingRewards`

## Current Expected Behavior After Hard Refresh

After a hard browser refresh:

### Standalone method

Running standalone `runPendingRewards` should still work.

### Re-read

Running the same method again should show:

```text
onChainCallCount = 0
```

### Clicking Console Display `pendingRewards`

Expected trace:

```text
[SPCOIN_RPC_TRACE] tree server-backed dispatch panel=spcoin_rread method=estimateOffChainTotalRewards ...
server [SPCOIN_RPC_TRACE] server RPC request ...
server [SPCOIN_RPC_TRACE] server RPC response ...
```

It should not create:

```text
create browser Hardhat JsonRpcProvider
```

If it still creates a browser provider, there is another inline path bypassing `runServerBackedTreeSpCoinMethod`.

### Clicking Console Display `runPendingRewards`

Expected trace:

```text
[SPCOIN_RPC_TRACE] tree server-backed dispatch panel=spcoin_write method=runPendingRewards ...
server [SPCOIN_RPC_TRACE] server RPC request ...
server [SPCOIN_RPC_TRACE] server RPC response ...
```

It should not show:

```text
executeHardhatConnected start; label=runPendingRewards...
```

## Next Debug Steps

1. Hard refresh browser to clear old Fast Refresh bundles.
2. Enable Trace.
3. Run standalone `runPendingRewards`.
4. Re-run standalone `runPendingRewards` to confirm cache hit.
5. Click `pendingRewards` in the Console Display.
6. Check whether Trace shows:

```text
tree server-backed dispatch
```

or:

```text
create browser Hardhat JsonRpcProvider
```

7. If browser provider still appears, search for direct `runSpCoinReadMethod` / `runSpCoinWriteMethod` calls in pending-reward-related UI code.

Useful search:

```powershell
rg -n "pendingRewards|runSpCoinReadMethod|runSpCoinWriteMethod|ensureReadRunner|executeWriteConnected" app\(menu)\(dynamic)\SponsorCoinLab components\shared
```

## Files Touched In This Debugging Thread

```text
app/(menu)/(dynamic)/SponsorCoinLab/hooks/useSponsorCoinLabNetwork.ts
app/(menu)/(dynamic)/SponsorCoinLab/hooks/useSponsorCoinLabMethodExecution.ts
app/(menu)/(dynamic)/SponsorCoinLab/hooks/useSponsorCoinLabTreeMethods.ts
app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/shared/spCoinRpcTrace.ts
app/api/spCoin/run-script/route.ts
spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/utils/accountCacheEventListener.ts
```

Other previously touched files related to Console Display reward rendering:

```text
components/shared/JsonInspector.tsx
app/(menu)/(dynamic)/SponsorCoinLab/components/OutputResultsCard.tsx
app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/shared/spCoinAccessRuntime.ts
app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/shared/spCoinAccessIncludes.ts
app/(menu)/(dynamic)/SponsorCoinLab/hooks/useSponsorCoinLabRateKeyOptions.ts
lib/spCoinLab/accountPopupTrace.ts
```

## Verification Already Run

Typecheck passed after the latest edits:

```powershell
npm run -s typecheck
```

## Working Hypothesis

This is not primarily an RPC availability issue.

The CORS/503 noise appears when browser-side code creates a Hardhat `JsonRpcProvider` and calls the EC2 RPC directly. The same operations work through the Next.js server route. Therefore, Hardhat RPC work should be routed through `/api/spCoin/run-script` whenever the app is in Hardhat mode, especially for inline Console Display actions.

The cache system itself appears to work correctly, based on the re-read with zero on-chain calls.
