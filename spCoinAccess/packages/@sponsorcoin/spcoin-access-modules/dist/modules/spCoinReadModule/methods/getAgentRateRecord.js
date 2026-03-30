// @ts-nocheck
import { AgentRateStruct } from "../../../dataTypes/spCoinDataTypes";
import { bigIntToDateTimeString, bigIntToDecString } from "../../../utils/dateTime";
export async function getAgentRateRecord(context, _sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey) {
    const runtime = context;
    runtime.spCoinLogger.logFunctionHeader("getAgentRateRecord(" + _sponsorKey + ", " + _recipientKey + ", " + _agentKey + ", " + _agentRateKey + ")");
    const agentRateRecord = new AgentRateStruct();
    let recordStr = ["0", "0", "0"];
    try {
        recordStr = await runtime.spCoinSerialize.getAgentRateRecordFields(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey);
    }
    catch (_error) {
        recordStr = ["0", "0", "0"];
    }
    agentRateRecord.agentRate = _agentRateKey;
    agentRateRecord.creationTime = bigIntToDateTimeString(recordStr[0]);
    agentRateRecord.lastUpdateTime = bigIntToDateTimeString(recordStr[1]);
    agentRateRecord.stakedSPCoins = bigIntToDecString(recordStr[2]);
    try {
        agentRateRecord.transactions = await runtime.getAgentRateTransactionList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey);
    }
    catch (_error) {
        agentRateRecord.transactions = [];
    }
    runtime.spCoinLogger.logExitFunction();
    return agentRateRecord;
}
