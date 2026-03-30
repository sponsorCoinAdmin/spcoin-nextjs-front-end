/**
 * SponsorCoin Access Modules
 * File: dist/offChain/deleteAccountTree.js
 * Role: Off-chain helper that walks the SponsorCoin account tree and deletes leaf records first.
 */
export declare function deleteAccountTree(): Promise<{
    accountCount: number;
    recipientCount: number;
    recipientRateCount: number;
    agentCount: number;
    deletedAgentCount: number;
    deletedRecipientCount: number;
    deletedAccountCount: number;
}>;
