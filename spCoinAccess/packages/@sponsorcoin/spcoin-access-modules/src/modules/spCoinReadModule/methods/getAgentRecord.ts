// @ts-nocheck
import { AgentStruct } from "../../../dataTypes/spCoinDataTypes";
import { bigIntToDecString } from "../../../utils/dateTime";
export async function getAgentRecord(context, _sponsorKey, _recipientKey, _recipientRateKey, _agentKey) {
    const runtime = context;
    runtime.spCoinLogger.logFunctionHeader("getAgentRecord = async(" + ", " + _sponsorKey + ", " + _recipientKey + ", " + _recipientRateKey + ", " + _agentKey + ")");
    const agentRecord = new AgentStruct();
    agentRecord.agentKey = _agentKey;
    agentRecord.stakedSPCoins = bigIntToDecString(await runtime.spCoinContractDeployed.getAgentTotalRecipient(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey));
    agentRecord.agentRateList = await runtime.getAgentRateRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey);
    runtime.spCoinLogger.logExitFunction();
    return agentRecord;
}

