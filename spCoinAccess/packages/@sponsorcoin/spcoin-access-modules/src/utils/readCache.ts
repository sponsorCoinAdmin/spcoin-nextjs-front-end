// @ts-nocheck

export type SpCoinReadCacheMode = "default" | "refresh" | "bypass" | "only";

export type SpCoinReadCacheOptions = {
  cache?: SpCoinReadCacheMode;
  cacheNamespace?: string;
  blockTag?: "latest" | "pending" | number;
  ttlMs?: number;
  traceCache?: boolean;
  timestampOverride?: string | number | bigint;
};

type CacheEntry = {
  value: unknown;
  cachedAt: number;
  dependencies: Set<string>;
};

const cache = new Map<string, CacheEntry>();
const dependencyIndex = new Map<string, Set<string>>();

function normalizeAddress(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeArg(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(normalizeArg);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, innerValue]) => [key, normalizeArg(innerValue)]),
    );
  }
  if (typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value.trim())) {
    return value.trim().toLowerCase();
  }
  return value;
}

function stableJson(value: unknown): string {
  return JSON.stringify(normalizeArg(value));
}

function getContractAddress(context: unknown): string {
  const contract = (context as { spCoinContractDeployed?: Record<string, unknown> })?.spCoinContractDeployed;
  return normalizeAddress(contract?.target || contract?.address || contract?.contractAddress || "unknown-contract");
}

function getChainId(context: unknown): string {
  const contract = (context as { spCoinContractDeployed?: Record<string, unknown> })?.spCoinContractDeployed;
  const runner = contract?.runner as Record<string, unknown> | undefined;
  const provider = (runner?.provider || runner || contract?.provider) as Record<string, unknown> | undefined;
  const network = provider?._network as { chainId?: unknown } | undefined;
  return String(network?.chainId ?? "unknown-chain");
}

export function isReadCacheOptions(value: unknown): value is SpCoinReadCacheOptions {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    "cache" in record ||
    "cacheNamespace" in record ||
    "blockTag" in record ||
    "ttlMs" in record ||
    "traceCache" in record ||
    "timestampOverride" in record
  );
}

export function splitReadCacheOptions(args: unknown[]): {
  args: unknown[];
  options: SpCoinReadCacheOptions;
} {
  const nextArgs = [...args];
  const last = nextArgs[nextArgs.length - 1];
  if (isReadCacheOptions(last)) {
    nextArgs.pop();
    return { args: nextArgs, options: last };
  }
  return { args: nextArgs, options: {} };
}

export function buildReadCacheKey(context: unknown, method: string, args: unknown[], options: SpCoinReadCacheOptions = {}): string {
  const scopedOptions =
    options.cacheNamespace != null || options.blockTag != null || options.timestampOverride != null
      ? {
          cacheNamespace: options.cacheNamespace,
          blockTag: options.blockTag,
          timestampOverride:
            typeof options.timestampOverride === "bigint"
              ? options.timestampOverride.toString()
              : options.timestampOverride,
        }
      : {};
  return [
    getChainId(context),
    getContractAddress(context),
    String(method || ""),
    stableJson(args),
    stableJson(scopedOptions),
  ].join(":");
}

function getDefaultDependencies(context: unknown, method: string, args: unknown[]): Set<string> {
  const contractAddress = getContractAddress(context);
  const chainId = getChainId(context);
  const dependencies = new Set<string>([
    `chain:${chainId}`,
    `contract:${chainId}:${contractAddress}`,
    `method:${String(method || "")}`,
  ]);

  for (const arg of args) {
    if (typeof arg === "string" && /^0x[a-fA-F0-9]{40}$/.test(arg.trim())) {
      dependencies.add(`account:${normalizeAddress(arg)}`);
    }
  }

  return dependencies;
}

function indexEntry(key: string, dependencies: Set<string>) {
  for (const dependency of dependencies) {
    if (!dependencyIndex.has(dependency)) dependencyIndex.set(dependency, new Set());
    dependencyIndex.get(dependency)?.add(key);
  }
}

function unindexEntry(key: string) {
  const entry = cache.get(key);
  if (!entry) return;
  for (const dependency of entry.dependencies) {
    const keys = dependencyIndex.get(dependency);
    keys?.delete(key);
    if (keys && keys.size === 0) dependencyIndex.delete(dependency);
  }
}

function setCacheEntry(key: string, value: unknown, dependencies: Set<string>) {
  unindexEntry(key);
  cache.set(key, { value, cachedAt: Date.now(), dependencies });
  indexEntry(key, dependencies);
}

function isEntryFresh(entry: CacheEntry, options: SpCoinReadCacheOptions) {
  const ttlMs = Number(options.ttlMs ?? 0);
  if (!Number.isFinite(ttlMs) || ttlMs <= 0) return true;
  return Date.now() - entry.cachedAt <= ttlMs;
}

function touchCacheEntry(entry: CacheEntry) {
  entry.cachedAt = Date.now();
}

function trace(context: unknown, options: SpCoinReadCacheOptions, message: string) {
  if (!options.traceCache) return;
  const logger = (context as { spCoinLogger?: { logDetail?: (value: string) => void } })?.spCoinLogger;
  logger?.logDetail?.(`JS => readCache ${message}`);
}

export async function runCachedRead(
  context: unknown,
  method: string,
  args: unknown[],
  options: SpCoinReadCacheOptions,
  loader: () => Promise<unknown> | unknown,
): Promise<unknown> {
  const mode = options.cache || "default";
  const key = buildReadCacheKey(context, method, args, options);
  const entry = cache.get(key);

  if (mode === "bypass") {
    trace(context, options, `bypass method=${method} key=${key}`);
    return await loader();
  }

  if (mode === "only") {
    const fresh = Boolean(entry && isEntryFresh(entry, options));
    trace(context, options, `${fresh ? "hit" : "miss"} only method=${method} key=${key}`);
    if (entry && fresh) {
      touchCacheEntry(entry);
      return entry.value;
    }
    return null;
  }

  if (mode !== "refresh" && entry && isEntryFresh(entry, options)) {
    trace(context, options, `hit method=${method} key=${key}`);
    touchCacheEntry(entry);
    return entry.value;
  }

  trace(context, options, `${mode === "refresh" ? "refresh" : "miss"} method=${method} key=${key}`);
  const value = await loader();
  setCacheEntry(key, value, getDefaultDependencies(context, method, args));
  trace(context, options, `set method=${method} key=${key}`);
  return value;
}

export function invalidateReadCacheByDependency(dependency: string): number {
  const keys = Array.from(dependencyIndex.get(dependency) || []);
  for (const key of keys) {
    unindexEntry(key);
    cache.delete(key);
  }
  return keys.length;
}

export function invalidateReadCacheForAccount(accountKey: string): number {
  return invalidateReadCacheByDependency(`account:${normalizeAddress(accountKey)}`);
}

export function invalidateReadCacheForContract(contractAddress: string, chainId = "unknown-chain"): number {
  return invalidateReadCacheByDependency(`contract:${String(chainId)}:${normalizeAddress(contractAddress)}`);
}

export function clearReadCache(): void {
  cache.clear();
  dependencyIndex.clear();
}

export function getReadCacheSize(): number {
  return cache.size;
}
