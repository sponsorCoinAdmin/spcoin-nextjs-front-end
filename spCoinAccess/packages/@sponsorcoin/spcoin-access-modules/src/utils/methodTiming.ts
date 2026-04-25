export type OnChainCallTiming = {
    method: string;
    runTimeMs: number;
};
export type MethodTimingMeta = {
    startedAt: string;
    completedAt: string;
    runTimeMs: number;
    onChainRunTimeMs: number;
    offChainRunTimeMs: number;
    onChainCallCount: number;
    onChainCalls: OnChainCallTiming[];
};
export type MethodTimingCollector = {
    startedAtMs: number;
    onChainCalls: OnChainCallTiming[];
    recordOnChainCall: (method: string, runTimeMs: number) => void;
};
const ACTIVE_COLLECTORS_GLOBAL_KEY = "__spcoinActiveMethodTimingCollectors";
function getActiveCollectorsStore(): MethodTimingCollector[] {
    const scope = globalThis as typeof globalThis & {
        [ACTIVE_COLLECTORS_GLOBAL_KEY]?: MethodTimingCollector[];
    };
    if (!Array.isArray(scope[ACTIVE_COLLECTORS_GLOBAL_KEY])) {
        scope[ACTIVE_COLLECTORS_GLOBAL_KEY] = [];
    }
    return scope[ACTIVE_COLLECTORS_GLOBAL_KEY]!;
}
const CONTRACT_HELPER_SKIP_SET = new Set([
    "addListener",
    "attach",
    "connect",
    "emit",
    "fallback",
    "getAddress",
    "getError",
    "getEvent",
    "getFunction",
    "listenerCount",
    "listeners",
    "off",
    "on",
    "once",
    "removeAllListeners",
    "removeListener",
    "toJSON",
]);
export function createMethodTimingCollector(startedAtMs = Date.now()): MethodTimingCollector {
    const collector: MethodTimingCollector = {
        startedAtMs,
        onChainCalls: [],
        recordOnChainCall(method, runTimeMs) {
            collector.onChainCalls.push({
                method: String(method || "").trim() || "unknown",
                runTimeMs: Math.max(0, Number(runTimeMs || 0)),
            });
        },
    };
    return collector;
}
function getActiveCollector() {
    const activeCollectors = getActiveCollectorsStore();
    return activeCollectors.length > 0 ? activeCollectors[activeCollectors.length - 1] : undefined;
}
export async function runWithMethodTimingCollector<T>(
    collector: MethodTimingCollector,
    callback: () => Promise<T>,
): Promise<T> {
    const activeCollectors = getActiveCollectorsStore();
    activeCollectors.push(collector);
    try {
        return await callback();
    }
    finally {
        const collectorIndex = activeCollectors.lastIndexOf(collector);
        if (collectorIndex >= 0) {
            activeCollectors.splice(collectorIndex, 1);
        }
    }
}
export async function timeOnChainCall<T>(method: string, callback: () => Promise<T>): Promise<T> {
    const startedAtMs = Date.now();
    try {
        return await callback();
    }
    finally {
        const collector = getActiveCollector();
        if (collector) {
            collector.recordOnChainCall(method, Date.now() - startedAtMs);
        }
    }
}
export function buildMethodTimingMeta(
    collector: MethodTimingCollector,
    completedAtMs = Date.now(),
): MethodTimingMeta {
    const runTimeMs = Math.max(0, completedAtMs - Number(collector?.startedAtMs || completedAtMs));
    const onChainCalls = Array.isArray(collector?.onChainCalls) ? collector.onChainCalls.map((entry) => ({
        method: String(entry?.method || "").trim() || "unknown",
        runTimeMs: Math.max(0, Number(entry?.runTimeMs || 0)),
    })) : [];
    const onChainRunTimeMs = onChainCalls.reduce((total, entry) => total + entry.runTimeMs, 0);
    return {
        startedAt: new Date(Number(collector?.startedAtMs || completedAtMs)).toISOString(),
        completedAt: new Date(completedAtMs).toISOString(),
        runTimeMs,
        onChainRunTimeMs,
        offChainRunTimeMs: Math.max(0, runTimeMs - onChainRunTimeMs),
        onChainCallCount: onChainCalls.length,
        onChainCalls,
    };
}
export function wrapContractWithTiming<T extends object>(contract: T): T {
    if (!contract || typeof contract !== "object") {
        return contract;
    }
    if ((contract as T & { __spcoinTimingWrapped?: boolean }).__spcoinTimingWrapped) {
        return contract;
    }
    const wrapperCache = new Map<PropertyKey, unknown>();
    const proxy = new Proxy(contract, {
        get(target: T, prop: PropertyKey, receiver: unknown) {
            if (prop === "__spcoinTimingWrapped") {
                return true;
            }
            const value = Reflect.get(target, prop, receiver);
            if (typeof prop === "symbol" || typeof value !== "function") {
                return value;
            }
            if (wrapperCache.has(prop)) {
                return wrapperCache.get(prop);
            }
            const propName = String(prop || "");
            const wrapped = (...args: unknown[]) => {
                if (propName === "connect" || propName === "attach") {
                    return wrapContractWithTiming(value.apply(target, args));
                }
                if (CONTRACT_HELPER_SKIP_SET.has(propName)) {
                    return value.apply(target, args);
                }
                return timeOnChainCall(propName, () => Promise.resolve(value.apply(target, args)));
            };
            wrapperCache.set(prop, wrapped);
            return wrapped;
        },
    });
    return proxy;
}
