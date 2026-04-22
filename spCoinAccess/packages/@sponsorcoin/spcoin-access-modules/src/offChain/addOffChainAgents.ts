// @ts-nocheck
/**
 * SponsorCoin Access Modules
 * Role: Explicit off-chain helper that batches multiple on-chain addAgent calls.
 */
import { addAgents } from './addAgents';
export async function addOffChainAgents(recipientKey, recipientRateKey, agentAccountList) {
    return addAgents.call(this, recipientKey, recipientRateKey, agentAccountList);
}
