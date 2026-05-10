export declare function getPendingRewards(context: any, accountKey: any, timestampOverride?: any): Promise<{
    TYPE: string;
    accountKey: string;
    calculatedTimeStamp: string;
    calculatedFormatted: string;
    pendingSponsorRewards: string;
    pendingRecipientRewards: string;
    pendingAgentRewards: string;
    pendingRewards: string;
}>;
