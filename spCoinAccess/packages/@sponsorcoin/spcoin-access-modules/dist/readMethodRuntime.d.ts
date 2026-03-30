export type SpCoinAccessSource = 'local' | 'node_modules';
export type CompareContractSizeResult = {
    scriptPath: string;
    previousReleaseDir: string;
    latestReleaseDir: string;
    cached: boolean;
    report: unknown;
    stderr: string;
};
export type FormatCreationTimeResult = {
    ms_offset: string;
    formatted: string;
};
export type SpCoinReadExecutionContext = {
    canonicalMethod: string;
    selectedMethod: string;
    methodArgs: unknown[];
    spCoinAccessSource: SpCoinAccessSource;
    target: string;
    read: Record<string, unknown>;
    staking: Record<string, unknown>;
    contract: Record<string, unknown>;
    normalizeStringListResult: (value: unknown) => string[];
    toStringOrNumber: (value: unknown) => string | number;
    formatCreationTimeResult: (value: unknown) => FormatCreationTimeResult;
    requireExternalSerializedValue: (method: string, methodArgs: unknown[]) => Promise<string>;
    compareSpCoinContractSize: (previousReleaseDir: string, latestReleaseDir: string) => Promise<CompareContractSizeResult>;
};
export type SpCoinReadMethodHandler = {
    method: string;
    run: (context: SpCoinReadExecutionContext) => Promise<unknown>;
};
export declare function buildHandler(method: string, run: (context: SpCoinReadExecutionContext) => Promise<unknown>): SpCoinReadMethodHandler;
export declare function getDynamicMethod(target: Record<string, unknown>, method: string): (...args: unknown[]) => unknown;
export declare function runDynamicMethod(context: SpCoinReadExecutionContext, method?: string): Promise<unknown>;
export declare function createDynamicHandler(method: string, after?: (result: unknown, context: SpCoinReadExecutionContext) => Promise<unknown> | unknown): SpCoinReadMethodHandler;
export declare function createReadHandler(method: string, mapArgs?: (context: SpCoinReadExecutionContext) => unknown[]): SpCoinReadMethodHandler;
export declare function createPassthroughFirstArgHandler(method: string): SpCoinReadMethodHandler;
export declare function createSerializedHandler(config: {
    method: string;
    localMethod: string;
    localArgs?: (context: SpCoinReadExecutionContext) => unknown[];
}): SpCoinReadMethodHandler;
