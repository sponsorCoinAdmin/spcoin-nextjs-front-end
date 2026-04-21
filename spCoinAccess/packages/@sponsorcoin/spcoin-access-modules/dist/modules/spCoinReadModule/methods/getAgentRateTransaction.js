// @ts-nocheck
import { AgentRateStruct } from "../../../dataTypes/spCoinDataTypes";
import { bigIntToDateTimeString, bigIntToDecString } from "../../../utils/dateTime";
export async function getAgentTransaction(context, _sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey) {
    const runtime = context;
    runtime.spCoinLogger.logFunctionHeader("getAgentTransaction(" + _sponsorKey + ", " + _recipientKey + ", " + _agentKey + ", " + _agentRateKey + ")");
    const agentTransaction = new AgentRateStruct();
    let recordStr = ["0", "0", "0"];
    try {
        recordStr = await runtime.spCoinSerialize.getAgentTransactionFields(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey);
    }
    catch (_error) {
        recordStr = ["0", "0", "0"];
    }
    agentTransaction.agentRate = _agentRateKey;
    agentTransaction.creationTime = bigIntToDateTimeString(recordStr[0]);
    agentTransaction.lastUpdateTime = bigIntToDateTimeString(recordStr[1]);
    agentTransaction.stakedSPCoins = bigIntToDecString(recordStr[2]);
    try {
        agentTransaction.transactions = await runtime.getAgentTransactionEntries(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey);
    }
    catch (_error) {
        agentTransaction.transactions = [];
    }
    runtime.spCoinLogger.logExitFunction();
    return agentTransaction;
}
