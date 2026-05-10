import * as readMethods from "./methods";
import { runCachedRead, splitReadCacheOptions, type SpCoinReadCacheOptions } from "../../utils/readCache";
import type {
  SpCoinReadBoundMethod,
  SpCoinReadMethod,
  SpCoinReadModuleContext,
} from "./types";

const TIME_SENSITIVE_METHODS = new Set([
  "getAccountRecord",
  "getAccountRecordShallow",
  "getPendingRewards",
]);

function applyMethodCacheDefaults(methodName: string, options: SpCoinReadCacheOptions): SpCoinReadCacheOptions {
  if (methodName === "getPendingRewards") {
    if (options.cache != null || options.blockTag != null || options.timestampOverride != null) return options;
    return {
      ...options,
      cache: "bypass",
    };
  }
  if (!TIME_SENSITIVE_METHODS.has(methodName)) return options;
  if (options.ttlMs != null || options.blockTag != null || options.timestampOverride != null) return options;
  return {
    ...options,
    ttlMs: 60 * 60 * 1000,
  };
}

export function bindReadMethods(context: SpCoinReadModuleContext): void {
  const methodEntries = Object.entries(readMethods) as Array<[string, SpCoinReadMethod]>;

  for (const [name, method] of methodEntries) {
    context[name] = (async (...args: unknown[]) => {
      const { args: methodArgs, options } = splitReadCacheOptions(args);
      const cacheOptions = applyMethodCacheDefaults(name, options);
      const finalArgs =
        name === "getPendingRewards" && cacheOptions.timestampOverride != null
          ? [...methodArgs, cacheOptions.timestampOverride]
          : methodArgs;
      return runCachedRead(context, name, finalArgs, cacheOptions, () => method(context, ...finalArgs));
    }) as SpCoinReadBoundMethod;
  }
}

