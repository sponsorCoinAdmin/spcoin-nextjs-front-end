# SponsorCoinLab Session Handoff

Date: 2026-05-06
Workspace: `c:\Users\robin\spCoin\SPCOIN-PROJECT-MODULES\spcoin-nextjs-front-end`

This handoff is intentionally detailed. It is meant to let the next session resume without needing the chat history.

## Current Goal

We are trying to reduce SponsorCoinLab RPC usage, gas pressure, and token size pressure by moving reward preview/read calculations off-chain while keeping real reward settlement writes authoritative on-chain.

Important rule:

- Off-chain calculations are for preview/read paths and parity checks.
- On-chain reward calculations are still required for real writes/security.
- The long-term goal is to remove redundant on-chain read requests once the off-chain calculation is proven to match.

## Main Accounts Used In Testing

Sponsor:

```text
0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
```

Recipient:

```text
0x70997970c51812dc3a010c7d01b50e0d17dc79c8
```

Agent:

```text
0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc
```

Active SponsorCoin contract:

```text
0x5ec031d8b89182b29027e9dd157789a1d060fbdf
```

Current Hardhat RPC public nginx URL:

```text
https://rpc.sponsorcoin.org/f5b4d4b4a2614a540189b979d068639c3fd44bbb1dfcdb5a
```

## Important Files Changed

Files touched during this session:

```text
app/(menu)/(dynamic)/SponsorCoinLab/SponsorCoinLabController/utils.ts
app/(menu)/(dynamic)/SponsorCoinLab/SponsorCoinLabController/hooks/useControllerContractMetadata.ts
app/api/spCoin/run-script/route.ts
spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/modules/spCoinReadModule/methods/getAccountRecord.ts
spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/modules/spCoinReadModule/methods/getAccountPendingRewards.ts
spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/utils/methodTiming.ts
spCoinAccess/scripts/test2--script-1778097397625-j0s1jx.json
docs/handoff.md
```

There may be unrelated dirty workspace changes from earlier interrupted sessions. Do not revert anything unless the user explicitly asks.

## What Was Fixed / Implemented

### 1. Formatted Output ISO Timestamp Bug

File:

```text
app/(menu)/(dynamic)/SponsorCoinLab/SponsorCoinLabController/utils.ts
```

Problem:

- ISO timestamps like `2026-03-14T22:08:39.000Z` were being parsed as serialized map strings because they contain colons.
- This produced broken formatted output such as:

```json
"calculatedAt": {
  "2026-03-14T22": {
    "08": "39.000Z"
  }
}
```

Fix:

- Added an ISO UTC timestamp guard before serialized map parsing.
- Formatted output now keeps `calculatedAt` as a normal string.

### 2. Off-Chain Pending Reward Calculation

File:

```text
spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/modules/spCoinReadModule/methods/getAccountPendingRewards.ts
```

Implemented/updated:

- Reuses shared cached relationship helpers from `getAccountRecord.ts`.
- Accepts an optional `timestampOverride` for settlement-block parity checks.
- Uses Solidity-matching constants and integer arithmetic:

```text
YEAR_SECONDS = 31556925n
DECIMAL_MULTIPLIER = 10n ** 18n
PERCENT_DIVISER = DECIMAL_MULTIPLIER / 100n
```

Important detail:

- Parent reward math must use Solidity's two-stage integer division. A small rounding mismatch was fixed here.

Verified:

- Sponsor, recipient, and agent reward previews matched on-chain settlement deltas exactly in parity runs.
- `offlineComparison.difference` reached zero for all reward buckets after the formula fix.

### 3. Shared Relationship Caching / Fewer RPC Calls

File:

```text
spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/modules/spCoinReadModule/methods/getAccountRecord.ts
```

Exported/reused cache helpers:

```text
getInflationRateCached
getAccountRecordObjectCached
getRecipientRateListCached
getRecipientRateAgentListCached
getAgentRateListCached
getRateTransactionSetCached
getRecipientRateTransactionSetCached
getAgentRateTransactionSetCached
```

Observed call-count improvements:

```text
getAccountPendingRewards: about 14 -> 10 on-chain calls
getAccountRecord: about 30 -> 14 on-chain calls
```

Later runs sometimes showed `getAccountRecord` failing after 8 calls because it was using cache for some earlier values before an nginx 503 occurred.

### 4. Offline Comparison For Writes

File:

```text
app/api/spCoin/run-script/route.ts
```

Added request flag:

```ts
compareOfflineRewards?: boolean
```

When enabled for `updateAccountStakingRewards`, the result can include:

```text
offlineComparison.latestBlockPreview
offlineComparison.settlementTimestamp
offlineComparison.settlementTimestampPreview
offlineComparison.settlementTimestampDelta
offlineComparison.difference
```

Important:

- This comparison is now opt-in only.
- Normal writes do not do the extra 10-read offline comparison by default.
- Normal write path is back to 5 on-chain calls:
  - before `getAccountRecord`
  - before `getAccountRewardTotals`
  - write tx
  - after `getAccountRecord`
  - after `getAccountRewardTotals`

### 5. Script Updated For Reward Parity

File:

```text
spCoinAccess/scripts/test2--script-1778097397625-j0s1jx.json
```

The script was renamed/repurposed for reward parity testing. It runs:

- pending reward read
- account record read
- sponsor settlement write
- recipient settlement write
- agent settlement write

This was used repeatedly to compare off-chain preview deltas to on-chain settlement results.

### 6. Transaction Timing Improved

File:

```text
spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/utils/methodTiming.ts
```

Added timing fields:

```text
broadcastMs
receiptWaitMs
```

Example successful write output:

```json
{
  "method": "updateAccountStakingRewards",
  "onChainRunTimeMs": "54",
  "broadcastMs": "34",
  "receiptWaitMs": "20",
  "gasUsed": "343,138"
}
```

This made it clear when a failure occurred at broadcast time versus receipt wait time.

### 7. Server Broadcast Handling

File:

```text
app/api/spCoin/run-script/route.ts
```

Current behavior:

- Signs transaction once.
- Computes signed tx hash with `Transaction.from(signedTransaction).hash`.
- Broadcasts once with `provider.broadcastTransaction(signedTransaction)`.
- If broadcast errors, checks once whether the transaction is already known via:
  - `getTransactionReceipt(hash)`
  - `getTransaction(hash)`
- Does not do arbitrary retry loops.

This was important because the user rejected timer/retry kludges. The current handling is for ambiguity only: if nginx returns a bad response after forwarding the transaction, we check whether the tx actually landed.

## 503 / RPC Investigation

### What Happened

During repeated reward runs, the public EC2 nginx RPC sometimes returned:

```text
503 Service Temporarily Unavailable
```

Errors happened on both:

- write broadcast paths
- read paths such as `getAccountRecord`

The response was nginx HTML, not a JSON-RPC error:

```html
<html>
<head><title>503 Service Temporarily Unavailable</title></head>
<body>
<center><h1>503 Service Temporarily Unavailable</h1></center>
<hr><center>nginx/1.28.0</center>
</body>
</html>
```

### Direct RPC Proof

A direct harmless JSON-RPC call to the public endpoint was tested:

```text
eth_blockNumber
```

It sometimes returned nginx `503`, proving the issue was not:

- reward math
- contract logic
- ethers only
- transaction signing
- the Next route only

The failure layer is the public nginx RPC proxy / upstream Hardhat path.

### Transport Diagnostics Added

File:

```text
app/api/spCoin/run-script/route.ts
```

When a step error is classified as `transport`, the route now:

1. Runs a same-moment raw `eth_blockNumber` probe against the same RPC role.
2. Adds transport diagnostics to the failed payload.
3. Logs a server line beginning with:

```text
[spcoin-rpc-transport]
```

Diagnostic fields include:

```text
probedAt
rpcHost
rpcPathLength
role
method
httpStatus
httpStatusText
responseHeaders.server
responseHeaders.date
responseBodyPreview
durationMs
```

Because formatted output hid the nested diagnostic in one run, the route was also patched to:

- add a top-level `rpcTransport` field on failed payloads
- append a visible trace line like:

```text
rpcTransport probe role=read; method=eth_blockNumber; status=503; server=nginx/1.28.0; durationMs=...
```

### Key 503 Evidence From Latest Logs

The final diagnostic log captured:

```text
[spcoin-rpc-transport] {
  "script": "getAccountRecord",
  "step": 1,
  "panel": "spcoin_rread",
  "method": "getAccountRecord",
  "classification": "transport",
  "error": "server response 503 Service Temporarily Unavailable ... nginx/1.28.0 ...",
  "rpcTransport": {
    "role": "read",
    "method": "eth_blockNumber",
    "httpStatus": 200,
    "httpStatusText": "OK",
    "responseHeaders": {
      "server": "nginx/1.28.0"
    },
    "durationMs": 55
  }
}
```

Interpretation:

- The failing request got nginx `503`.
- Immediately after, a raw `eth_blockNumber` probe to the same public endpoint returned `200 OK`.
- So the entire RPC was not down.
- Nginx/upstream is intermittently rejecting or failing individual requests.

Likely causes:

- nginx `limit_req` / `limit_conn`
- upstream connection exhaustion
- upstream Hardhat process intermittently closing/refusing one request
- fragile public proxy under short chained JSON-RPC bursts

## Metadata Loop / Background Pressure Fix

File:

```text
app/(menu)/(dynamic)/SponsorCoinLab/SponsorCoinLabController/hooks/useControllerContractMetadata.ts
```

Problem:

- Server logs showed a huge flood of:

```text
GET /api/spCoin/access-manager?deploymentPublicKey=...&deploymentChainId=31337&includeMetadata=true
```

- The metadata effect depended on the whole `exchangeContext`.
- The effect fetched metadata, then called `setSettings`.
- That could change `exchangeContext`, retriggering the metadata fetch loop.

Fix:

- Narrowed effect dependencies to primitive metadata fields and chain id.
- Added no-op logic so identical fetched metadata does not write back to settings again.

After restart:

- The `includeMetadata=true` flood stopped.
- Only one metadata call appeared on startup.
- Several reward runs succeeded with no 503.

Conclusion:

- The metadata loop was a real pressure source and likely a major contributor.
- It was not the whole problem because a later normal `getAccountRecord` read still hit nginx 503.

## Current 503 Conclusion

We fixed a local app loop that was hammering the RPC.

However, the public nginx RPC can still intermittently return 503 to individual requests during normal chained reads.

This cannot be fixed 100% from Next app code if the server-backed route continues to use the public nginx RPC URL.

The durable fix is to split RPC paths:

- browser/public clients use nginx public RPC
- server-side Next reads/writes use a private/internal direct RPC path to Hardhat

## Deployment / Infrastructure Plan Discussed

User's setup:

- Hardhat runs on an EC2 instance.
- nginx is on the same EC2 instance.
- Next.js runs locally on the user's PC during development.
- There is also a deployed Next.js instance on EC2, but current local changes need redeploying there.

For local PC Next.js:

- `http://127.0.0.1:8545` is not valid unless using an SSH tunnel.
- Optional dev tunnel:

```powershell
ssh -i C:\path\to\key.pem -L 8545:127.0.0.1:8545 ubuntu@EC2_PUBLIC_IP
```

Then local `.env.local` can use:

```env
NEXT_SERVER_HARDHAT_RPC_URL=http://127.0.0.1:8545
SPCOIN_HARDHAT_WRITE_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_HARDHAT_RPC_URL=https://rpc.sponsorcoin.org/f5b4d4b4a2614a540189b979d068639c3fd44bbb1dfcdb5a
```

For EC2-deployed Next.js:

Since Next and Hardhat are on the same EC2 instance, configure the EC2 Next app env as:

```env
NEXT_SERVER_HARDHAT_RPC_URL=http://127.0.0.1:8545
SPCOIN_HARDHAT_WRITE_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_HARDHAT_RPC_URL=https://rpc.sponsorcoin.org/f5b4d4b4a2614a540189b979d068639c3fd44bbb1dfcdb5a
```

Then rebuild/restart EC2 Next.

Important verification after deploy:

The run-script trace should show:

```text
server run-script start; rpc=http://127.0.0.1:8545; writeRpc=http://127.0.0.1:8545
```

If it still shows the public `https://rpc.sponsorcoin.org/...`, then the server route is still using nginx and the test is not valid.

## Nginx Notes

Changing buffers may help but is not the root fix.

Relevant nginx knobs to inspect:

```nginx
limit_req
limit_conn
limit_req_status
proxy_http_version
proxy_set_header Connection
proxy_connect_timeout
proxy_send_timeout
proxy_read_timeout
upstream keepalive
worker_connections
```

If rate limiting is the cause, return `429 Too Many Requests` rather than nginx HTML `503`:

```nginx
limit_req_status 429;
```

Example upstream hardening shape:

```nginx
upstream hardhat_rpc {
    server 127.0.0.1:8545;
    keepalive 64;
}

location /... {
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_connect_timeout 5s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    proxy_pass http://hardhat_rpc;
}
```

Caution:

- Bigger buffers/bursts only create more headroom.
- They do not make Hardhat production-grade.
- For real multi-user production, public Hardhat-style RPC is not enough.

## Production Scaling Concern

The user correctly pointed out:

- If one user can occasionally trigger 503s, many users will be worse.

Current answer:

- This setup is not production scalable as-is.
- Server-side reads/writes should not use the public nginx RPC.
- Browser traffic needs a hardened public gateway.
- Writes should use a dedicated write path / transaction service with nonce management.
- Expensive reads like `getAccountRecord` must keep shrinking RPC fanout.
- Hardhat is fine for simulation/dev but not a production public RPC backend.

## Current Verification

Command run after code changes:

```text
npm.cmd run -s typecheck
```

Status:

```text
passed
```

Contract size check previously run:

```text
npm.cmd run compare:spcoin:size
```

Observed latest:

```text
deployedBytes: 23263
EIP-170 margin: 1313
```

## Recommended Next Session Steps

1. Redeploy current changes to EC2 Next instance.

2. Configure EC2 Next environment:

```env
NEXT_SERVER_HARDHAT_RPC_URL=http://127.0.0.1:8545
SPCOIN_HARDHAT_WRITE_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_HARDHAT_RPC_URL=https://rpc.sponsorcoin.org/f5b4d4b4a2614a540189b979d068639c3fd44bbb1dfcdb5a
```

3. Rebuild/restart the EC2 Next app.

4. Run the same SponsorCoinLab reward parity script from the EC2-hosted app.

5. Verify trace contains:

```text
rpc=http://127.0.0.1:8545
writeRpc=http://127.0.0.1:8545
```

6. Run multiple cycles:

- pending rewards
- account record
- sponsor update
- recipient update
- agent update

7. Watch for:

- no nginx `503`
- no `[spcoin-rpc-transport]`
- writes stay at 5 on-chain calls
- `broadcastMs` and `receiptWaitMs` remain normal

8. If 503s still occur while using `127.0.0.1:8545` on EC2, then nginx is no longer involved and the focus shifts to Hardhat process capacity/health directly.

9. Continue reducing `getAccountRecord` fanout:

- It can still require 10-14 RPC reads.
- A later 503 happened mid-read after 8 calls.
- Fewer calls means fewer opportunities for any RPC transport failure.

## Important User Preferences

The user rejected timer/retry/broadcast-loop kludges. Avoid suggesting:

- arbitrary delays between script steps
- "try up to 5 times" retry loops
- masking the underlying transport failure

Preferred approach:

- identify the exact failing layer
- fix root cause there
- reduce redundant RPC calls
- keep diagnostics visible and evidence-based

