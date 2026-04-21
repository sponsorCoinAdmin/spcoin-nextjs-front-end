// @ts-nocheck
import { AgentRateStruct } from "../../../dataTypes/spCoinDataTypes";
import { bigIntToDateTimeString, bigIntToDecString } from "../../../utils/dateTime";
export async function getAgentTransaction(context, _sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey) {
    const runtime = context;
    runtime.spCoinLogger.logFunctionHeader("getAgentTransaction(" + _sponsorKey + ", " + _recipientKey + ", " + _agentKey + ", " + _agentRateKey + ")");
    const agentTransaction = new AgentRateStruct();
    let inserted = false;
    let recordStr = ["0", "0", "0"];
    try {
        const core = await runtime.spCoinContractDeployed.getAgentTransactionCore(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey);
        inserted = Boolean(core?.[4]);
        if (inserted) {
            recordStr = [
                String(core?.[1] ?? "0"),
                String(core?.[2] ?? "0"),
                String(core?.[3] ?? "0"),
            ];
        }
    }
    catch (_error) {
        inserted = false;
        recordStr = ["0", "0", "0"];
    }
    if (!inserted) {
        try {
            recordStr = await runtime.spCoinSerialize.getAgentTransactionFields(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey);
            inserted = !((recordStr[0] || "0") === "0" && (recordStr[1] || "0") === "0" && (recordStr[2] || "0") === "0");
        }
        catch (_error) {
            inserted = false;
            recordStr = ["0", "0", "0"];
        }
    }
    agentTransaction.agentRate = _agentRateKey;
    agentTransaction.inserted = inserted;
    agentTransaction.creationTime = inserted ? bigIntToDateTimeString(recordStr[0]) : "";
    agentTransaction.lastUpdateTime = inserted ? bigIntToDateTimeString(recordStr[1]) : "";
    agentTransaction.stakedSPCoins = bigIntToDecString(recordStr[2]);
    if (inserted) {
        try {
            agentTransaction.transactions = await runtime.getAgentTransactionEntries(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey);
        }
        catch (_error) {
            agentTransaction.transactions = [];
        }
    }
    else {
        agentTransaction.transactions = [];
    }
    runtime.spCoinLogger.logExitFunction();
    return agentTransaction;
}

