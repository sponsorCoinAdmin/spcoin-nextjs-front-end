/**
 * SponsorCoin Access Modules
 * File: dist/offChain/deleteAccountTree.d.ts
 * Role: Type declarations for the off-chain deleteAccountTree helper.
 */
export declare function deleteAccountTree(this: any): Promise<{
    accountCount: number;
    recipientCount: number;
    recipientRateCount: number;
    agentCount: number;
    deletedAgentCount: number;
    deletedRecipientCount: number;
    deletedAccountCount: number;
}>;
