export declare function getSpCoinMetaData(context: any): Promise<{
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
