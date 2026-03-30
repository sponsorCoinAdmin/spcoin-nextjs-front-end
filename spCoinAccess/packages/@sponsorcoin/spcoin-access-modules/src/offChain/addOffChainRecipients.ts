// @ts-nocheck
/**
 * SponsorCoin Access Modules
 * Role: Explicit off-chain helper that batches multiple on-chain addRecipient calls.
 */
import { addRecipients } from './addRecipients';

export async function addOffChainRecipients(accountKey, recipientAccountList) {
    return addRecipients.call(this, accountKey, recipientAccountList);
}
