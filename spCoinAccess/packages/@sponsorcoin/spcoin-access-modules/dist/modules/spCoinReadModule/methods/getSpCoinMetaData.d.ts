import type { SpCoinReadModuleContext } from "../types";
export declare function getSpCoinMetaData(context: SpCoinReadModuleContext): Promise<{
    owner: string;
    version: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
    inflationRate: number;
    recipientRateRange: number[];
    agentRateRange: number[];
}>;
