# SpCoin Access Cache Design

Date: 2026-05-06
Workspace: `c:\Users\robin\spCoin\SPCOIN-PROJECT-MODULES\spcoin-nextjs-front-end`

This document describes the proposed cache architecture for the npm `spCoin-access` library and SponsorCoinLab. The goal is to move as many reads as safely possible off-chain/local while keeping the chain authoritative and keeping writes/event invalidation correct.

## Current Problem

The current access flow still performs many repeated on-chain reads:

```text
getAccountPendingRewards: 10 on-chain calls
getAccountRecord: 14 on-chain calls
updateAccountStakingRewards: 5 on-chain calls
```

The immediate read pressure is mostly relationship and transaction-set discovery:

```text
getAccountRecord
getAccountLinks
getSponsorRecipientRates
getRecipientRateTransactionSetKey
getRateTransactionSet
getRecipientRateAgentList
getAgentRateList
getAgentRateTransactionSetKey
getRateTransactionSet
getInflationRate
```

There is already an account cache utility:

```text
spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/utils/accountCache.ts
```

and an event listener utility:

```text
spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/utils/accountCacheEventListener.ts
```

However, the current local `access.read.getAccountRecord` path mostly bypasses that persistent account cache. The cache is currently useful only in the direct contract fallback path inside:

```text
app/api/spCoin/run-script/route.ts
```

The target architecture is to make cache-aware reads the normal public read path in the npm library.

## Core Principle

All normal public read methods should go through a cache-aware read gateway.

```text
public read method
  -> cache gateway
  -> cache hit OR chain read
  -> normalize result
  -> write/update cache
  -> return result
```

Writes and on-chain events must invalidate or update affected cache entries:

```text
write tx / receipt / event
  -> determine affected entities
  -> invalidate/update dependent cache keys
```

The chain remains authoritative. The cache is a local performance layer, not a separate source of truth.

## Public API Shape

Normal library consumers should call familiar read methods:

```ts
read.getAccountRecord(accountKey);
read.getAccountPendingRewards(accountKey);
read.getRecipientRateList(sponsorKey, recipientKey);
read.getAgentRateList(sponsorKey, recipientKey, recipientRateKey, agentKey);
```

Those methods should be cache-governed internally.

The raw on-chain reads should not be the ordinary public path. They may remain available only for internal/debug/admin use.

Recommended public shape:

```ts
read.getAccountRecord(accountKey, options?);
read.getRecipientRateList(sponsorKey, recipientKey, options?);
read.getAccountPendingRewards(accountKey, options?);
```

Recommended internal/debug shape:

```ts
read.refreshAccountRecord(accountKey);
read.debug.raw.getAccountRecord(accountKey);
```

The exact debug API name can change, but it should be explicit and traceable.

## Cache Options

Use a shared options object rather than loose boolean arguments.

```ts
type CacheMode = 'default' | 'refresh' | 'bypass' | 'only';

type ReadOptions = {
  cache?: CacheMode;
  blockTag?: 'latest' | 'pending' | number;
  ttlMs?: number;
  traceCache?: boolean;
  timestampOverride?: string | number | bigint;
};
```

Cache modes:

```text
default
```

Use the cache if present and valid. On miss, read chain, normalize, update cache, return.

```text
refresh
```

Ignore existing cached value, read from chain, normalize, update cache, return. This is the preferred "force fresh" mode.

```text
bypass
```

Read directly from chain and do not read from or write to the cache. This is for advanced debugging only.

```text
only
```

Return cached value only. If missing, return null or a typed cache-miss result. This is useful for UI previews and diagnostics.

## SponsorCoinLab UI Behavior

SponsorCoinLab should expose a simple checkbox:

```text
[x] Use cache
```

Default: checked/on.

Behavior:

```text
Use cache checked
```

Call read methods with:

```ts
{ cache: 'default' }
```

```text
Use cache unchecked
```

Call read methods with:

```ts
{ cache: 'refresh' }
```

Unchecked should mean "read fresh from chain and update the cache." It should not mean true bypass by default.

If needed later, add an advanced/debug-only option:

```text
Bypass cache without updating
```

That maps to:

```ts
{ cache: 'bypass' }
```

## Cache Key Strategy

Every cache key should include:

```text
chainId
contractAddress
methodName
normalizedArgs
optional block/timestamp scope
```

Example key shape:

```ts
{
  chainId: '31337',
  contractAddress: '0x5ec031d8b89182b29027e9dd157789a1d060fbdf',
  method: 'getRecipientRateTransactionSet',
  args: [
    '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    '20',
  ],
}
```

Normalize addresses to lowercase.

Normalize bigint/number/rate values to strings.

Do not rely on object identity for cache keys.

## Cache Scope

The cache should cover more than account records.

Initial cacheable read types:

```text
account records
account links
account role summaries
master account metadata
master account list / active account list
recipient rate lists
recipient rate transaction set keys
recipient rate transaction sets
recipient rate agent lists
agent rate lists
agent rate transaction set keys
agent rate transaction sets
reward totals
inflation rate
pending reward previews
```

Pending reward previews need special handling because they are time-dependent.

## Stable Data vs Time-Dependent Data

Some values are stable until a write/event changes them:

```text
account links
recipient rate lists
agent rate lists
transaction set keys
account role summary
master account list
active account list
inflation rate unless changed by admin
```

Some values are time-dependent:

```text
pending staking rewards
totalSpCoins when it includes pending rewards
calculatedAt / calculatedAtTimestamp
```

Do not cache time-dependent values as if they were stable.

Preferred strategy for pending rewards:

```text
cache key includes explicit timestampOverride or block/timestamp scope
```

For normal "latest" pending reward reads, use either:

```text
short TTL
```

or:

```text
latest block number / timestamp as part of the cache scope
```

For parity testing around settlement writes, use explicit `timestampOverride` so the cache key is deterministic.

## Dependency Tracking

The cache should track dependencies so events and writes can invalidate all affected read results.

Each cached value should register dependency tags.

Example tags:

```text
contract:31337:0x5ec031...
account:0xf39...
account:0x709...
account:0x3c44...
relationship:sponsor:0xf39:recipient:0x709
recipientRate:sponsor:0xf39:recipient:0x709:rate:20
agentRate:sponsor:0xf39:recipient:0x709:rate:20:agent:0x3c44:agentRate:2
rewardTotals:0xf39...
pendingRewards:0xf39...
metadata
inflationRate
```

Maintain a reverse index:

```text
dependency tag -> cache keys
```

When a dependency changes, invalidate every cache key registered under that tag.

## Manual Invalidation From Writes

Manual invalidation should happen immediately after a write receipt succeeds.

For `updateAccountStakingRewards(accountKey)`:

Invalidate:

```text
getAccountRecord(accountKey)
getAccountRecordShallow(accountKey)
getAccountLinks(accountKey)
getAccountRoleSummary(accountKey)
getAccountRewardTotals(accountKey)
getAccountPendingRewards(accountKey)
any totalSpCoins/account summary value for accountKey
```

For sponsor/recipient relationship writes:

Invalidate:

```text
sponsor account record
recipient account record
sponsor account links
recipient account links
recipient parent links
recipient rate lists for sponsor/recipient
pending rewards for sponsor and recipient
account role summaries for sponsor and recipient
master/active account metadata if account activity changed
```

For agent relationship writes:

Invalidate:

```text
sponsor account record
recipient account record
agent account record
recipient rate agent list
agent rate list
agent rate transaction set
pending rewards for sponsor, recipient, agent
account role summaries for all affected accounts
```

For transaction-set changes:

Invalidate:

```text
recipient rate transaction set
agent rate transaction set
pending rewards for affected sponsor/recipient/agent
account records that include these relationship summaries
```

Manual invalidation from writes is required even if event invalidation exists, because event delivery may lag or may not be active in every runtime.

## Event Invalidation

Events should be used to keep the cache honest over time.

The existing event listener file is:

```text
spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/utils/accountCacheEventListener.ts
```

It currently targets account invalidation from `TransactionAdded`.

The new architecture should generalize event handling to invalidate all dependent cached method values, not only account records.

Event flow:

```text
contract event
  -> parse affected entities
  -> build dependency tags
  -> invalidate matching cache keys
```

Events that would be useful:

```text
TransactionAdded
AccountRewardsUpdated
SponsorshipChanged
RecipientRateChanged
AgentRelationshipChanged
AccountRecordChanged
InflationRateChanged
AccountActivated / AccountDeactivated
```

If current Solidity events already contain sponsor, recipient, agent, recipient rate, and agent rate information, no Solidity changes are needed for phase 1.

If current event payloads are too vague for precise invalidation, add Solidity events later.

## Solidity Changes

No Solidity changes are required for the first strong version of this cache architecture.

Phase 1 can use:

```text
cache gateway
manual invalidation after known writes
existing events where available
```

Solidity changes are only needed if current events do not provide enough data to invalidate precisely.

Possible future events:

```solidity
event AccountRecordChanged(address indexed accountKey);
event SponsorshipChanged(address indexed sponsorKey, address indexed recipientKey, uint256 recipientRateKey);
event AgentRelationshipChanged(
    address indexed sponsorKey,
    address indexed recipientKey,
    uint256 recipientRateKey,
    address agentKey,
    uint256 agentRateKey
);
event AccountRewardsUpdated(address indexed accountKey);
```

## Raw Read Bypass Policy

Normal app/library consumers should not bypass the cache.

Allowed bypass cases:

```text
internal library implementation
explicit refresh mode
advanced SponsorCoinLab diagnostics
tests
emergency debugging
```

Recommended rule:

```text
The only normal exposed points are cached methods.
Raw reads live under explicit internal/debug APIs.
```

This preserves debuggability without allowing accidental bypass everywhere.

## Trace And Debug Output

SponsorCoinLab and server routes should show whether cache was used.

Useful trace lines:

```text
cache mode=default
cache hit method=getAccountRecord key=...
cache miss method=getAccountRecord key=...
cache refresh method=getAccountRecord key=...
cache bypass method=getAccountRecord key=...
cache set method=getAccountRecord key=... dependencies=[...]
cache invalidate dependency=account:0xf39... count=...
cache invalidate method=getAccountPendingRewards reason=AccountRewardsUpdated
```

Method result metadata can include:

```json
{
  "cache": {
    "mode": "default",
    "status": "hit",
    "key": "31337:0x5ec...:getAccountRecord:...",
    "cachedAt": "2026-05-06T22:00:00.000Z"
  }
}
```

This will make SponsorCoinLab runs useful for proving reduced on-chain read counts.

## Recommended Implementation Phases

### Phase 1: Cache Gateway Skeleton

Create a generic cache gateway in the npm access library.

Responsibilities:

```text
build cache keys
honor cache modes
store normalized values
register dependency tags
trace hits/misses
invalidate by key/dependency
```

### Phase 2: Account And Relationship Reads

Route these through the cache gateway first:

```text
getAccountRecordObject
getAccountLinks
getAccountRecord
getAccountRecordShallow
getAccountRoleSummary
getRecipientRateList
getRecipientRateAgentList
getAgentRateList
getRecipientRateTransactionSetKey
getAgentRateTransactionSetKey
getRateTransactionSet
```

This should directly reduce the current repeated `10 + 14` read pattern.

### Phase 3: Manual Write Invalidation

Wire every known write method to invalidate affected dependency tags after successful receipt.

This includes:

```text
add sponsorship/recipient/agent transaction methods
delete methods
rate range setters
updateAccountStakingRewards
backdate methods
```

### Phase 4: Event Invalidation

Start and manage event listeners where the runtime supports them.

Events should invalidate dependency tags, not only account records.

Event invalidation is a second layer, not a replacement for write invalidation.

### Phase 5: Pending Reward Cache

Add block/timestamp-aware caching for:

```text
getAccountPendingRewards
totalSpCoins pending reward fields
```

Do this only after stable relationship caching is working.

### Phase 6: SponsorCoinLab Controls

Add a `Use cache` checkbox to method execution UI.

Default on.

Checked:

```ts
{ cache: 'default' }
```

Unchecked:

```ts
{ cache: 'refresh' }
```

Advanced/debug-only:

```ts
{ cache: 'bypass' }
```

## Testing Plan

Use the current SponsorCoinLab reward script.

Baseline from recent run:

```text
getAccountPendingRewards: 10 on-chain calls
getAccountRecord: 14 on-chain calls
updateAccountStakingRewards sponsor: 5 on-chain calls
updateAccountStakingRewards recipient: 5 on-chain calls
updateAccountStakingRewards agent: 5 on-chain calls
```

Expected improvements after Phase 1/2:

```text
first read: cache misses and chain reads
second related read: cache hits and fewer on-chain calls
repeated same script before writes: near-zero relationship reads
after write: affected account cache invalidated
next read: affected account rebuilds, unaffected data remains cached
```

Important assertions:

```text
no stale reward totals after updateAccountStakingRewards
no stale relationship lists after add/delete relationship writes
pending reward parity with settlement timestamp remains exact
SponsorCoinLab trace shows hit/miss/refresh clearly
Use cache unchecked refreshes from chain and updates cache
```

## Current Recommendation

Proceed deliberately.

Do not try to convert every method at once.

Start with the account/relationship graph because it is the current largest repeated read cost and is mostly stable between writes.

Then add pending rewards once the stable cache gateway and invalidation model are proven.

The final target remains:

```text
Only cache-governed read methods are normal exposed methods.
Raw on-chain reads are internal/debug-only.
Writes and events keep the cache valid.
```
