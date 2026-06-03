// @ts-nocheck

export type SpCoinReadCacheMode = "default" | "refresh" | "bypass" | "only";
export const FALLBACK_READ_CACHE_TTL_MS = 10_000;

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

function parsePositiveMs(value: unknown): number | null {
  const parsed = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function getDefaultReadCacheTtlMs(): number {
  const publicTtlMs = parsePositiveMs(process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS);
  if (publicTtlMs !== null) return publicTtlMs;
  const serverTtlMs = parsePositiveMs(process.env.SPCOIN_READ_CACHE_TTL_MS);
  if (serverTtlMs !== null) return serverTtlMs;
  return FALLBACK_READ_CACHE_TTL_MS;
}

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

function getProviderScopeInfo(context: unknown): {
  chainId: string;
  contractAddress: string;
  providerType: string;
  runnerType: string;
  rpcUrl: string;
  scopeSource: string;
} {
  const contract = (context as { spCoinContractDeployed?: Record<string, unknown> })?.spCoinContractDeployed;
  const runner = contract?.runner as Record<string, unknown> | undefined;
  const provider = (runner?.provider || runner || contract?.provider) as Record<string, unknown> | undefined;
  const providerType = String(provider?.constructor?.name || typeof provider || "unknown");
  const runnerType = String(runner?.constructor?.name || typeof runner || "unknown");
  const connectionUrl =
    typeof provider?._getConnection === "function"
      ? (provider._getConnection() as { url?: unknown } | undefined)?.url
      : provider?.connection && typeof provider.connection === "object"
        ? (provider.connection as { url?: unknown }).url
        : (provider?._connection && typeof provider._connection === "object"
            ? (provider._connection as { url?: unknown }).url
            : undefined);
  const rpcUrl = String(connectionUrl ?? "").trim();
  const contractAddress = getContractAddress(context);
  if (rpcUrl) {
    return {
      chainId: `rpc:${rpcUrl}`,
      contractAddress,
      providerType,
      runnerType,
      rpcUrl,
      scopeSource: "rpcUrl",
    };
  }
  const network = provider?._network as { chainId?: unknown } | undefined;
  const chainId = String(network?.chainId ?? provider?.chainId ?? runner?.chainId ?? "unknown-chain");
  return {
    chainId,
    contractAddress,
    providerType,
    runnerType,
    rpcUrl,
    scopeSource: chainId === "unknown-chain" ? "unknown" : "chainId",
  };
}

function getChainId(context: unknown): string {
  return getProviderScopeInfo(context).chainId;
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
  const ttlMs = parsePositiveMs(options.ttlMs) ?? getDefaultReadCacheTtlMs();
  if (!Number.isFinite(ttlMs) || ttlMs <= 0) return false;
  return Date.now() - entry.cachedAt <= ttlMs;
}

function getEntryAgeMs(entry: CacheEntry | undefined, nowMs = Date.now()) {
  return entry ? Math.max(0, nowMs - Number(entry.cachedAt || nowMs)) : null;
}

function getEffectiveTtlMs(options: SpCoinReadCacheOptions) {
  return parsePositiveMs(options.ttlMs) ?? getDefaultReadCacheTtlMs();
}

function compactKey(value: string) {
  if (value.length <= 240) return value;
  return `${value.slice(0, 180)}...${value.slice(-48)}`;
}

function serializeTraceArg(value: unknown): string {
  try {
    const json = stableJson(value);
    return json.length <= 160 ? json : `${json.slice(0, 120)}...${json.slice(-32)}`;
  } catch {
    return String(value);
  }
}

function emitBrowserTrace(line: string) {
  try {
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new CustomEvent("spcoin-rpc-trace", { detail: { line } }));
    }
  } catch {
    // Tracing must never affect read behavior.
  }
}

function trace(context: unknown, options: SpCoinReadCacheOptions, message: string) {
  if (!options.traceCache) return;
  const logger = (context as { spCoinLogger?: { logDetail?: (value: string) => void } })?.spCoinLogger;
  const line = `[SPCOIN_READ_CACHE_TRACE] ${message}`;
  logger?.logDetail?.(`JS => ${line}`);
  emitBrowserTrace(line);
  try {
    console.debug(line);
  } catch {
    // Ignore console failures in restricted runtimes.
  }
}

function traceReadCacheDecision(params: {
  context: unknown;
  options: SpCoinReadCacheOptions;
  method: string;
  args: unknown[];
  key: string;
  phase: string;
  mode: SpCoinReadCacheMode;
  entry?: CacheEntry;
  fresh?: boolean;
  detail?: string;
}) {
  const { context, options, method, args, key, phase, mode, entry, fresh, detail } = params;
  if (!options.traceCache) return;
  const nowMs = Date.now();
  const scope = getProviderScopeInfo(context);
  const ttlMs = getEffectiveTtlMs(options);
  const ageMs = getEntryAgeMs(entry, nowMs);
  const dependencies = entry ? Array.from(entry.dependencies).join(",") : "";
  trace(
    context,
    options,
    [
      `phase=${phase}`,
      `method=${method}`,
      `mode=${mode}`,
      `hasEntry=${String(Boolean(entry))}`,
      `fresh=${fresh == null ? "n/a" : String(fresh)}`,
      `ageMs=${ageMs == null ? "n/a" : String(ageMs)}`,
      `ttlMs=${String(ttlMs)}`,
      `cacheSize=${String(cache.size)}`,
      `namespace=${String(options.cacheNamespace ?? "")}`,
      `timestampOverride=${String(options.timestampOverride ?? "")}`,
      `blockTag=${String(options.blockTag ?? "")}`,
      `scopeSource=${scope.scopeSource}`,
      `chainScope=${scope.chainId}`,
      `contract=${scope.contractAddress}`,
      `provider=${scope.providerType}`,
      `runner=${scope.runnerType}`,
      `rpcUrl=${scope.rpcUrl || ""}`,
      `args=${serializeTraceArg(args)}`,
      `deps=${dependencies}`,
      `key=${compactKey(key)}`,
      detail ? `detail=${detail}` : "",
    ].filter(Boolean).join(" "),
  );
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
    traceReadCacheDecision({ context, options, method, args, key, phase: "bypass", mode, entry, fresh: false });
    return await loader();
  }

  if (mode === "only") {
    const fresh = Boolean(entry && isEntryFresh(entry, options));
    traceReadCacheDecision({ context, options, method, args, key, phase: fresh ? "hit-only" : "miss-only", mode, entry, fresh });
    if (entry && fresh) {
      return entry.value;
    }
    return null;
  }

  if (mode !== "refresh" && entry && isEntryFresh(entry, options)) {
    traceReadCacheDecision({ context, options, method, args, key, phase: "hit", mode, entry, fresh: true });
    return entry.value;
  }

  traceReadCacheDecision({
    context,
    options,
    method,
    args,
    key,
    phase: mode === "refresh" ? "refresh" : "miss",
    mode,
    entry,
    fresh: entry ? isEntryFresh(entry, options) : false,
  });
  const value = await loader();
  setCacheEntry(key, value, getDefaultDependencies(context, method, args));
  traceReadCacheDecision({
    context,
    options,
    method,
    args,
    key,
    phase: "set",
    mode,
    entry: cache.get(key),
    fresh: true,
    detail: `valueType=${Array.isArray(value) ? "array" : typeof value}`,
  });
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
