# NPM Package Cache Design

## Purpose

The SponsorCoinLab cache system should be owned by the `@sponsorcoin/spcoin-access-modules` package. SponsorCoinLab, API routes, and UI panels should not implement their own read-cache rules. They should only pass cache options into package read/write methods.

This matters because Solidity has no cache. SponsorCoin reward and AMM-style calculations are offline calculations performed by the npm package. The cache must therefore live at the package layer where those offline reads and calculations are composed.

## Current Problem

The current cache behavior is split across multiple layers:

- Package read cache in `spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/utils/readCache.ts`
- SponsorCoinLab UI shortcuts for pending reward snapshots
- Server-backed hardhat routes with separate server memory cache
- Browser-side reads with separate browser memory cache
- Manual cache clearing in SponsorCoinLab controller/server code
- Hidden claim pre-read behavior that can run reward estimates before writes

This split makes cache behavior inconsistent. A read may cache in the browser while a hardhat claim runs on the server and cannot see that browser cache. Claim methods can appear to bypass cache because they secretly perform read/estimate work before the actual write transaction.

## Design Goals

1. Cache logic resides in the npm package.
2. Every package read method supports the same cache options.
3. Every read method can force blockchain read-through when cache is disabled globally.
4. Every read method can invalidate its exact cache member with `ttlMs: 0`.
5. The package exposes `clearCache` to remove the package cache.
6. Writes invalidate affected cached reads after successful transactions.
7. SponsorCoinLab exposes cache options but does not own cache behavior.
8. Claim methods are writes and should not secretly perform full reward estimates unless explicitly requested.

## Package Cache Subsystem

The cache should be isolated as its own subsystem inside the npm package. This keeps cache design, keying, TTL policy, read-through behavior, and write invalidation in one containerized package area.

Suggested structure:

```txt
spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/cache/
  index.ts
  types.ts
  readCacheStore.ts
  readCacheKeys.ts
  readCacheTags.ts
  readCachePolicy.ts
  readCacheRuntime.ts
  writeInvalidation.ts
```

Responsibilities:

`types.ts`

Defines shared cache types:

- `SpCoinReadCacheMode`
- `SpCoinReadCacheOptions`
- cache entries
- cache tags/dependencies
- cache decision/result metadata

`readCacheKeys.ts`

Builds stable cache keys from:

- provider/chain scope
- contract address
- method name
- normalized method arguments
- namespace
- block tag
- timestamp override

`readCacheTags.ts`

Builds method/domain tags for cache entries. This is where method-specific dependencies such as `rewards`, `rates`, `inflation`, and `account:<address>` should be centralized.

`readCachePolicy.ts`

Interprets cache options:

- `cache`
- `readThrough`
- `ttlMs`
- default TTLs
- cache hit/miss/read-through decisions

`readCacheStore.ts`

Owns the in-memory cache maps:

- cache entry map
- dependency/tag index
- exact-entry removal
- dependency/tag invalidation
- full clear
- cache size inspection

`readCacheRuntime.ts`

Exposes the package read wrapper:

```ts
runCachedRead(context, method, args, options, loader)
```

This is the only function package read methods should need for normal cached reads.

`writeInvalidation.ts`

Maps package write methods to cache invalidation tags/accounts and exposes helpers like:

```ts
invalidateAfterWrite(methodName, args, result, context)
```

`index.ts`

Provides the public cache subsystem export surface. Other package modules should import from `src/cache`, not from cache internals.

### Compatibility Shim

The existing `src/utils/readCache.ts` can remain temporarily as a compatibility shim that re-exports from `src/cache`.

This allows migration without changing every import in one pass:

```ts
export * from '../cache';
```

After package modules are updated to import from `src/cache`, the shim can remain for backward compatibility or be removed in a later cleanup.

### Access Rule

SponsorCoinLab and app/server routes should not import cache internals. They may pass `SpCoinReadCacheOptions` into package read/write methods, but cache key construction, TTL interpretation, and invalidation rules should be package-owned.

## Standard Read Cache Options

All package read methods should accept an optional final cache options parameter where required:

```ts
export type SpCoinReadCacheMode = 'default' | 'refresh' | 'bypass' | 'only';

export type SpCoinReadCacheOptions = {
  cache?: SpCoinReadCacheMode;
  readThrough?: boolean;
  ttlMs?: number;
  cacheNamespace?: string;
  blockTag?: 'latest' | 'pending' | number;
  traceCache?: boolean;
  timestampOverride?: string | number | bigint;
};
```

### Option Semantics

`cache: 'default'`

Use a fresh cached value if available. If no fresh value exists, read from chain/offline source and store the result.

`cache: 'refresh'`

Ignore any current cached value, read from chain/offline source, and replace the cached value.

`cache: 'bypass'`

Ignore cache and read from chain/offline source. Do not store the result. This is the global cache checkbox off behavior.

`cache: 'only'`

Use cache only. Do not call chain. If no fresh cached value exists, return `null` or a defined cache-miss result.

`readThrough: true`

Allow chain/offline read-through on cache miss. This is the default for `cache: 'default'` and `cache: 'refresh'`.

`readThrough: false`

Do not call chain/offline source. This is equivalent to cache-only behavior unless combined with an explicit invalidation operation.

`ttlMs > 0`

Override the TTL for this read call.

`ttlMs: 0`

Invalidate the exact cache member for this method, arguments, namespace, block tag, and timestamp override. After invalidation, behavior follows `cache` and `readThrough`.

## Global Cache Checkbox

SponsorCoinLab should map the global Cache checkbox into package cache options.

When checked:

```ts
{
  cache: 'default',
  readThrough: true
}
```

When unchecked:

```ts
{
  cache: 'bypass',
  readThrough: true
}
```

Unchecked means "force live blockchain results." It should not use cached values and should not update the cache.

The Refresh button with cache checked should use:

```ts
{
  cache: 'refresh',
  readThrough: true
}
```

## Dropdown Method Cache Parameters

Dropdown methods in SponsorCoinLab should expose cache parameters for read methods and offline package calculations where cache is relevant.

Suggested optional parameters:

- `Cache Mode`: `default`, `refresh`, `bypass`, `only`
- `Read Through`: `true`, `false`
- `TTL Ms`: number, where `0` invalidates the exact cached member
- `Trace Cache`: `true`, `false`

These are UI/runtime options, not Solidity arguments. They must be stripped from the Solidity/package method argument list and converted into the final `SpCoinReadCacheOptions` object.

Example script params:

```json
{
  "method": "estimateOffChainSponsorRewards",
  "params": [
    { "key": "Account Key", "value": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266" },
    { "key": "Cache Mode", "value": "default" },
    { "key": "Read Through", "value": "true" },
    { "key": "TTL Ms", "value": "86400000" }
  ]
}
```

Effective package call:

```ts
await access.read.estimateOffChainSponsorRewards(accountKey, {
  cache: 'default',
  readThrough: true,
  ttlMs: 86_400_000,
});
```

## Cache Storage and Keys

The package cache should key entries by:

- chain/provider scope
- contract address
- method name
- normalized method arguments
- cache namespace
- block tag
- timestamp override, when relevant

Address arguments should be normalized to lowercase for key stability.

## Cache Tags and Dependencies

Cache entries should also be indexed by tags so writes can invalidate affected data without clearing everything.

Default tags:

- `chain:<chainScope>`
- `contract:<chainScope>:<contractAddress>`
- `method:<methodName>`
- `account:<accountKey>` for each address argument

Domain tags:

- `inflation`
- `rates`
- `rate-transactions`
- `account-record`
- `account-links`
- `rewards`

Examples:

`getInflationRate`

```ts
['inflation']
```

`getAccountRecord(accountKey)`

```ts
['account-record', `account:${accountKey}`]
```

`getAccountLinks(accountKey)`

```ts
['account-links', `account:${accountKey}`]
```

`getSponsorRecipientRates(sponsorKey, recipientKey)`

```ts
['rates', `account:${sponsorKey}`, `account:${recipientKey}`]
```

`estimateOffChainTotalRewards(accountKey)`

```ts
['rewards', `account:${accountKey}`]
```

## Read Cache API

The package should expose a small cache API:

```ts
runCachedRead(context, method, args, options, loader)
invalidateReadCacheEntry(context, method, args, options)
invalidateReadCacheByDependency(dependency)
invalidateReadCacheByDependencies(dependencies)
invalidateReadCacheForAccount(accountKey)
invalidateReadCacheForContract(contractAddress, chainId)
clearReadCache()
getReadCacheSize()
```

`invalidateReadCacheEntry` is needed for `ttlMs: 0` and `invalidate: true`.

## Write Invalidation

Writes should invalidate package cache after successful transaction receipt. They should not repopulate the cache.

Repopulation belongs to the next read, using that read method's TTL/options.

Suggested invalidation:

`claimOnChainTotalRewards(accountKey)`

```ts
invalidate ['rewards', `account:${accountKey}`]
```

`claimOnChainSponsorRewards(accountKey)`

```ts
invalidate ['rewards', `account:${accountKey}`]
```

`addRecipientTransaction(sponsorKey, recipientKey, ...)`

```ts
invalidate ['rewards', 'account-links', 'rates', `account:${sponsorKey}`, `account:${recipientKey}`]
```

`addAgentTransaction(sponsorKey, recipientKey, agentKey, ...)`

```ts
invalidate ['rewards', 'account-links', 'rates', `account:${sponsorKey}`, `account:${recipientKey}`, `account:${agentKey}`]
```

Inflation/rate configuration writes:

```ts
invalidate ['inflation', 'rates', 'rewards']
```

If a write method cannot determine affected accounts precisely, it may invalidate broader domain tags. Broad tag invalidation is preferable to stale cached calculations.

## Claim Method Rule

Claim methods are writes. They should not secretly run full read/estimate methods before the transaction.

Allowed claim behavior:

1. Submit the claim transaction.
2. Wait for the receipt.
3. Invalidate affected cache entries.
4. Return transaction/receipt/gas details.

If the UI needs reward estimate details, it should explicitly run the estimate method first or pass a previously computed estimate snapshot for display purposes. The claim method itself should not force the 17 read calls required by offline reward estimation.

## Browser vs Server Cache Boundary

Browser and server memory caches are separate. The design must not assume a browser-warmed cache is visible to server-backed hardhat writes.

Recommended execution model:

- Hardhat/local mode: route package reads and writes through the server package instance.
- Metamask/browser mode: route package reads and writes through the browser package instance.

If a hardhat claim runs server-side, it should not rely on browser cache state.

## Migration Plan

1. Update package `readCache.ts` with `readThrough`, exact-entry invalidation, `ttlMs: 0`, and improved trace phases.
2. Ensure every package read method uses `runCachedRead` or a wrapper that delegates to it.
3. Add method/domain tags for common read methods.
4. Add package write invalidation after successful receipts.
5. Remove SponsorCoinLab hidden claim pre-read behavior.
6. Convert SponsorCoinLab dropdown cache params into `SpCoinReadCacheOptions`.
7. Keep the global Cache checkbox as a default cache-mode source.
8. Remove UI/server cache workarounds that duplicate package behavior.

## Expected SponsorCoinLab Behavior

With Cache checked:

- First estimate after refresh reads chain and stores cache.
- Second estimate hits cache.
- Claim sends only the claim transaction.
- Reads after claim refresh invalidated members only.

With Cache unchecked:

- Reads force blockchain/offline live execution.
- Cached values are ignored.
- Results are not written into cache.

With `TTL Ms = 0` on a read method:

- That exact cache member is invalidated.
- If read-through is enabled, the method reads live and stores according to cache mode.
- If read-through is disabled/cache-only, the method returns cache miss/null after invalidation.

## Admin Utils clearCache Method

The package cache subsystem should expose a public `clearCache` method. SponsorCoinLab should surface this under the Admin Utils dropdown.

Purpose:

- Remove all entries from the package cache.
- Clear tag/dependency indexes.
- Return cache statistics for display/debugging.

Suggested package API:

```ts
clearCache(options?: { traceCache?: boolean }): {
  cleared: true;
  entriesBefore: number;
  entriesAfter: number;
};
```

Suggested Admin Utils dropdown method:

```json
{
  "title": "clearCache",
  "group": "Admin Utils",
  "params": [
    { "label": "Trace Cache", "type": "boolean", "optional": true }
  ]
}
```

Expected result:

```json
{
  "cleared": true,
  "entriesBefore": 42,
  "entriesAfter": 0
}
```

`clearCache` is different from the global Cache checkbox:

- Cache checkbox unchecked means bypass cache for reads.
- `clearCache` removes existing cached values.

## Open Decisions

1. Should cache-only misses return `null` or throw a typed cache miss error?
2. Should write invalidation default to enabled for all package writes?
3. Should per-method cache controls be visible by default or collapsed under a Cache Options group?
4. Should hardhat reads always be server-backed to keep one cache instance per run mode?
