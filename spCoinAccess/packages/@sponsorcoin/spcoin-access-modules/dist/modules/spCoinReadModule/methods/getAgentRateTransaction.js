// @ts-nocheck
import { AgentRateStruct } from "../../../dataTypes/spCoinDataTypes";
import { bigIntToDateTimeString, bigIntToDecString } from "../../../utils/dateTime";
export async function getAgentRateTransaction(context, _sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey) {
    const runtime = context;
    runtime.spCoinLogger.logFunctionHeader("getAgentRateTransaction(" + _sponsorKey + ", " + _recipientKey + ", " + _agentKey + ", " + _agentRateKey + ")");
    const agentRateTransaction = new AgentRateStruct();
    let recordStr = ["0", "0", "0"];
    try {
        recordStr = await runtime.spCoinSerialize.getAgentRateTransactionFields(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey);
    }
    catch (_error) {
        recordStr = ["0", "0", "0"];
    }
    agentRateTransaction.agentRate = _agentRateKey;
    agentRateTransaction.creationTime = bigIntToDateTimeString(recordStr[0]);
    agentRateTransaction.lastUpdateTime = bigIntToDateTimeString(recordStr[1]);
    agentRateTransaction.stakedSPCoins = bigIntToDecString(recordStr[2]);
    try {
        agentRateTransaction.transactions = await runtime.getAgentRateTransactionEntries(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey);
    }
    catch (_error) {
        agentRateTransaction.transactions = [];
    }
    runtime.spCoinLogger.logExitFunction();
    return agentRateTransaction;
}
