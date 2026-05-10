# Nginx 503 Issue Notes

Date: 2026-05-06
Workspace: `c:\Users\robin\spCoin\SPCOIN-PROJECT-MODULES\spcoin-nextjs-front-end`

This document records the intermittent RPC `503 Service Temporarily Unavailable` issue observed while testing SponsorCoinLab against the EC2-hosted Hardhat chain. The issue is currently relatively stable and hard to reproduce, but we may need to return to it.

## Current Status

The current local development setup is:

```text
Local PC Next.js dev server -> https://rpc.sponsorcoin.org/... -> nginx on EC2 -> Hardhat RPC on EC2
```

The active public RPC URL is:

```text
https://rpc.sponsorcoin.org/f5b4d4b4a2614a540189b979d068639c3fd44bbb1dfcdb5a
```

In local `.env.local`, the relevant values are currently:

```env
NEXT_SERVER_HARDHAT_RPC_URL="https://rpc.sponsorcoin.org/f5b4d4b4a2614a540189b979d068639c3fd44bbb1dfcdb5a"
NEXT_PUBLIC_HARDHAT_RPC_URL="https://rpc.sponsorcoin.org/f5b4d4b4a2614a540189b979d068639c3fd44bbb1dfcdb5a"
```

`SPCOIN_HARDHAT_WRITE_RPC_URL` was not set locally during the investigation, so write calls fell back to the same public nginx RPC URL.

As of the latest testing, multiple SponsorCoinLab script runs completed successfully and the `503` could not be reproduced immediately. This is good, but it is not proof that the issue is gone. The earlier `503`s were intermittent.

## Important Clarification About `127.0.0.1`

`http://127.0.0.1:8545` only points to Hardhat when the code using it is running on the same EC2 instance as Hardhat.

From the local PC, this is wrong:

```env
NEXT_SERVER_HARDHAT_RPC_URL=http://127.0.0.1:8545
```

because `127.0.0.1` means the local PC, not the EC2 instance.

For local PC development, use the public nginx RPC:

```env
NEXT_SERVER_HARDHAT_RPC_URL=https://rpc.sponsorcoin.org/f5b4d4b4a2614a540189b979d068639c3fd44bbb1dfcdb5a
SPCOIN_HARDHAT_WRITE_RPC_URL=https://rpc.sponsorcoin.org/f5b4d4b4a2614a540189b979d068639c3fd44bbb1dfcdb5a
NEXT_PUBLIC_HARDHAT_RPC_URL=https://rpc.sponsorcoin.org/f5b4d4b4a2614a540189b979d068639c3fd44bbb1dfcdb5a
```

For Next.js deployed on the same EC2 instance as Hardhat, the recommended diagnostic/server-side config is:

```env
NEXT_SERVER_HARDHAT_RPC_URL=http://127.0.0.1:8545
SPCOIN_HARDHAT_WRITE_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_HARDHAT_RPC_URL=https://rpc.sponsorcoin.org/f5b4d4b4a2614a540189b979d068639c3fd44bbb1dfcdb5a
```

That keeps browser-facing RPC public, while server-side Next routes talk directly to the local Hardhat process.

## What The Error Looked Like

The failing SponsorCoinLab result showed:

```text
RPC transport error: server response 503 Service Temporarily Unavailable
```

The debug body showed nginx HTML:

```html
<html>
<head><title>503 Service Temporarily Unavailable</title></head>
<body>
<center><h1>503 Service Temporarily Unavailable</h1></center>
<hr><center>nginx/1.28.0</center>
</body>
</html>
```

That means the HTTP `503` response was emitted by nginx. It does not prove nginx is the root cause; nginx may simply be reporting that its upstream Hardhat RPC connection failed, timed out, was limited, or was closed.

The captured server-side diagnostic log looked like this:

```text
[spcoin-rpc-transport] {
  "script":"getAccountRecord",
  "step":1,
  "panel":"spcoin_rread",
  "method":"getAccountRecord",
  "sender":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "classification":"transport",
  "error":"server response 503 Service Temporarily Unavailable ... nginx/1.28.0 ...",
  "rpcTransport":{
    "probedAt":"2026-05-06T22:31:12.837Z",
    "rpcHost":"rpc.sponsorcoin.org",
    "rpcPathLength":49,
    "role":"read",
    "method":"eth_blockNumber",
    "httpStatus":200,
    "httpStatusText":"OK",
    "responseHeaders":{
      "server":"nginx/1.28.0",
      "date":"Wed, 06 May 2026 22:31:14 GMT"
    },
    "responseBodyPreview":"{\"jsonrpc\":\"2.0\",\"id\":1,\"result\":\"0x28ad32f\"}",
    "durationMs":55
  }
}
```

Key interpretation:

- The original JSON-RPC call received nginx HTML `503`.
- An immediate follow-up `eth_blockNumber` probe to the same RPC returned `200 OK`.
- The RPC endpoint was not globally down.
- Individual requests were intermittently failing or being rejected at the nginx/upstream boundary.

## Why Nginx May Return 503 With One User

nginx itself can handle much more traffic than this. A `503` with one user usually means nginx is acting as the front door and one of the upstream conditions failed.

Possible causes:

- Hardhat refused a connection.
- Hardhat closed or reset the upstream connection.
- nginx `limit_req` or `limit_conn` returned `503`.
- nginx could not get a timely upstream response from Hardhat.
- Too many short-lived HTTP connections were opened instead of reusing upstream keepalive connections.
- Next.js dev mode and SponsorCoinLab hydration created bursty request traffic.
- Hardhat dev node had a temporary stall or could not accept a request at that moment.

The important point: nginx being in the HTML response identifies the response layer, not necessarily the root cause.

## Changes Already Made To Reduce Pressure

### Metadata Hydration Loop Fix

File:

```text
app/(menu)/(dynamic)/SponsorCoinLab/SponsorCoinLabController/hooks/useControllerContractMetadata.ts
```

Before the fix, server logs showed repeated calls like:

```text
GET /api/spCoin/access-manager?deploymentPublicKey=...&deploymentChainId=31337&includeMetadata=true
```

This looked like a repeated metadata polling/hydration loop and likely created unnecessary local request pressure.

After the fix and server restart, the startup behavior was much quieter, with only one expected metadata call during initial hydration.

### Provider Batching Disabled For Server Hardhat Provider

File:

```text
app/api/spCoin/run-script/route.ts
```

The server-side Hardhat provider was changed to use:

```ts
{
  batchMaxCount: 1,
  staticNetwork: true,
}
```

This avoids ethers bundling multiple JSON-RPC calls into a batch. That makes each RPC call simpler to observe and reduces weird interactions with dev/proxy RPC servers that may not handle batching well.

### Transport Diagnostics Added

File:

```text
app/api/spCoin/run-script/route.ts
```

When a transport-level RPC error occurs, the route now adds diagnostics:

- `debug.rpcTransport`
- top-level `rpcTransport`
- trace entries identifying `rpc` and `writeRpc`
- server console line prefixed with `[spcoin-rpc-transport]`

This is meant to preserve the exact failure context without guessing.

### Reward Read Call Counts Reduced

Related files:

```text
spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/modules/spCoinReadModule/methods/getAccountPendingRewards.ts
spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/modules/spCoinReadModule/methods/getAccountRecord.ts
```

Observed improvements:

```text
getAccountPendingRewards: about 14 -> 10 on-chain calls
getAccountRecord: about 30 -> 14 on-chain calls
updateAccountStakingRewards: normally 5 on-chain calls when offline comparison is disabled
```

This reduces RPC pressure, but `getAccountRecord` is still the largest read fanout and remains a future optimization target.

## Latest Stable Run Pattern

The latest successful runs showed:

```text
getAccountPendingRewards: 10 on-chain calls
getAccountRecord: 14 on-chain calls
updateAccountStakingRewards sponsor: 5 on-chain calls
updateAccountStakingRewards recipient: 5 on-chain calls
updateAccountStakingRewards agent: 5 on-chain calls
```

All three writes succeeded in the latest pasted run.

The run trace still used the public nginx RPC unless the debug trace explicitly says otherwise:

```text
rpc=https://rpc.sponsorcoin.org/...
writeRpc=https://rpc.sponsorcoin.org/...
```

If testing the EC2-local direct path, the trace must instead show:

```text
rpc=http://127.0.0.1:8545
writeRpc=http://127.0.0.1:8545
```

If it does not, the test is still going through nginx.

## Diagnostic Plan If 503 Returns

### 1. Capture The App Error

From SponsorCoinLab, save the full method result JSON for the failing call.

Important fields:

```text
call.method
meta.startedAt
meta.completedAt
error.message
error.debug.trace
error.debug.rpcTransport
onChainCalls.calls
```

### 2. Capture The Server Console Line

Look for:

```text
[spcoin-rpc-transport]
```

Copy the full JSON log line.

This line tells us:

- which script failed
- which method failed
- whether the call was read or write
- which RPC URL role was used
- whether the same endpoint responded to a follow-up probe

### 3. Check Nginx Error Logs At The Exact Timestamp

On the EC2 instance, inspect nginx error logs around the UTC timestamp from the app error.

Common locations:

```text
/var/log/nginx/error.log
/var/log/nginx/access.log
```

Useful commands:

```bash
sudo tail -n 200 /var/log/nginx/error.log
sudo tail -n 200 /var/log/nginx/access.log
```

Search for lines around the failing timestamp that include one of these patterns:

```text
connect() failed
upstream timed out
limiting requests
limiting connections
no live upstreams
upstream prematurely closed connection
recv() failed
connect() to 127.0.0.1:8545 failed
```

What each likely means:

```text
connect() failed
```

nginx could not connect to Hardhat. Hardhat may have refused the connection, been down, hit a connection limit, or been momentarily unavailable.

```text
upstream timed out
```

Hardhat accepted or was contacted, but did not respond before nginx timeout.

```text
limiting requests / limiting connections
```

nginx rate limiting or connection limiting is configured and is intentionally rejecting traffic. If this is expected, return `429` instead of `503` so the app can classify it correctly.

```text
upstream prematurely closed connection / recv() failed
```

Hardhat closed/reset the connection while nginx was waiting.

```text
no live upstreams
```

nginx believes no configured upstream server is available.

### 4. Check Hardhat Process Logs

At the same timestamp, check the Hardhat process output on EC2.

Look for:

- crashes
- restarts
- memory pressure
- stalled output
- request exceptions
- process manager restarts

If Hardhat is managed by `pm2`, use:

```bash
pm2 logs
pm2 status
```

If Hardhat is managed by `systemd`, use:

```bash
journalctl -u <hardhat-service-name> --since "2026-05-06 22:25:00" --until "2026-05-06 22:35:00"
```

Adjust the timestamp window to the actual failure.

### 5. Run The EC2-Local Direct RPC Test

Redeploy or restart the EC2-hosted Next.js instance with:

```env
NEXT_SERVER_HARDHAT_RPC_URL=http://127.0.0.1:8545
SPCOIN_HARDHAT_WRITE_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_HARDHAT_RPC_URL=https://rpc.sponsorcoin.org/f5b4d4b4a2614a540189b979d068639c3fd44bbb1dfcdb5a
```

Then run the same SponsorCoinLab script.

The trace must show:

```text
rpc=http://127.0.0.1:8545
writeRpc=http://127.0.0.1:8545
```

Interpretation:

```text
Direct local RPC succeeds repeatedly
```

The problem is probably nginx/proxy/public RPC config or public-request pressure.

```text
Direct local RPC still fails
```

The problem is probably Hardhat process capacity, Hardhat request handling, or the app request pattern.

```text
Both public nginx and direct local RPC are stable after metadata-loop fix
```

The metadata loop and burst pressure were probably a major trigger, but keep diagnostics in place.

## Nginx Config Areas To Review

If nginx error logs implicate nginx or upstream connection handling, inspect the active nginx site config.

Areas to check:

```text
limit_req
limit_conn
limit_req_status
proxy_connect_timeout
proxy_send_timeout
proxy_read_timeout
proxy_http_version
proxy_set_header Connection
upstream keepalive
worker_connections
worker_rlimit_nofile
client/body/header buffer settings
```

Recommended shape for an upstream block:

```nginx
upstream hardhat_rpc {
    server 127.0.0.1:8545;
    keepalive 64;
}
```

Recommended shape for the RPC location:

```nginx
location /f5b4d4b4a2614a540189b979d068639c3fd44bbb1dfcdb5a {
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_connect_timeout 5s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    proxy_pass http://hardhat_rpc;
}
```

If rate limiting is intentionally enabled, prefer:

```nginx
limit_req_status 429;
```

instead of defaulting to `503`. A `429` is easier to classify correctly as rate limiting.

Do not expose raw Hardhat RPC directly to the public internet unless it is heavily restricted. Hardhat is not meant to be a hardened public JSON-RPC service.

## Buffer Increase Discussion

Increasing nginx buffers can help with large responses or headers, but the observed failures do not currently look like a response-buffer-size problem.

The failing body was a small nginx HTML `503`, and successful JSON-RPC calls were normal. A buffer increase is unlikely to be the root fix unless nginx error logs specifically show buffer-related messages such as:

```text
upstream sent too big header
client intended to send too large body
```

If those messages appear, then review:

```text
proxy_buffer_size
proxy_buffers
proxy_busy_buffers_size
client_max_body_size
large_client_header_buffers
```

But do not treat buffer increases as the first fix for this issue.

## Recommended Architecture For Stability

For the EC2 deployment:

```text
Browser -> public nginx RPC only when browser-side RPC is needed
Browser -> Next.js app/API
Next.js server routes -> private/internal Hardhat RPC
nginx -> public controlled gateway to Hardhat
Hardhat -> not directly exposed publicly
```

Recommended EC2 Next.js server-side env:

```env
NEXT_SERVER_HARDHAT_RPC_URL=http://127.0.0.1:8545
SPCOIN_HARDHAT_WRITE_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_HARDHAT_RPC_URL=https://rpc.sponsorcoin.org/f5b4d4b4a2614a540189b979d068639c3fd44bbb1dfcdb5a
```

Recommended local PC dev env:

```env
NEXT_SERVER_HARDHAT_RPC_URL=https://rpc.sponsorcoin.org/f5b4d4b4a2614a540189b979d068639c3fd44bbb1dfcdb5a
SPCOIN_HARDHAT_WRITE_RPC_URL=https://rpc.sponsorcoin.org/f5b4d4b4a2614a540189b979d068639c3fd44bbb1dfcdb5a
NEXT_PUBLIC_HARDHAT_RPC_URL=https://rpc.sponsorcoin.org/f5b4d4b4a2614a540189b979d068639c3fd44bbb1dfcdb5a
```

The EC2-local direct server RPC path is not a kludge; it is a standard deployment split where trusted server code uses a private upstream and public/browser traffic uses a controlled gateway.

## If This Must Support Many Clients

A single Hardhat dev node behind nginx should not be treated as a production-grade public RPC under real client load.

For many clients, the system should move toward:

- reducing read fanout in SponsorCoinLab and account hydration
- caching read-heavy server responses where correctness allows
- separating public read RPC traffic from server write/settlement traffic
- private server-side RPC for writes
- explicit nonce/write coordination if many writes can be initiated
- nginx logs and metrics for upstream failures
- a real RPC/node strategy if this becomes more than a simulation chain

The immediate code work already reduced some fanout, but `getAccountRecord` still does many calls and remains the biggest target.

## Current Best Interpretation

Based on the captured evidence:

```text
The RPC URL is valid.
The intermittent 503 was emitted by nginx.
The endpoint usually works and could return 200 immediately after a 503.
The issue is likely at the nginx -> Hardhat boundary or caused by bursty request pressure.
The previous metadata hydration loop likely made the situation worse.
The issue is currently hard to reproduce after cleanup.
```

Do not add arbitrary sleeps or multi-attempt retry loops as the primary fix. If failures return, use the nginx error log and EC2-local direct RPC test to identify the real failure mode.
