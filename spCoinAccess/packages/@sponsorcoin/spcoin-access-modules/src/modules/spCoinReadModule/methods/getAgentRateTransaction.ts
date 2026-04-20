// @ts-nocheck
import { AgentRateStruct } from "../../../dataTypes/spCoinDataTypes";
import { bigIntToDateTimeString, bigIntToDecString } from "../../../utils/dateTime";
export async function getAgentRateTransaction(context, _sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey) {
    const runtime = context;
    runtime.spCoinLogger.logFunctionHeader("getAgentRateTransaction(" + _sponsorKey + ", " + _recipientKey + ", " + _agentKey + ", " + _agentRateKey + ")");
    const agentRateTransaction = new AgentRateStruct();
    let inserted = false;
    let recordStr = ["0", "0", "0"];
    try {
        const core = await runtime.spCoinContractDeployed.getAgentRateTransactionCore(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey);
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
            recordStr = await runtime.spCoinSerialize.getAgentRateTransactionFields(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey);
            inserted = !((recordStr[0] || "0") === "0" && (recordStr[1] || "0") === "0" && (recordStr[2] || "0") === "0");
        }
        catch (_error) {
            inserted = false;
            recordStr = ["0", "0", "0"];
        }
    }
    agentRateTransaction.agentRate = _agentRateKey;
    agentRateTransaction.inserted = inserted;
    agentRateTransaction.creationTime = inserted ? bigIntToDateTimeString(recordStr[0]) : "";
    agentRateTransaction.lastUpdateTime = inserted ? bigIntToDateTimeString(recordStr[1]) : "";
    agentRateTransaction.stakedSPCoins = bigIntToDecString(recordStr[2]);
    if (inserted) {
        try {
            agentRateTransaction.transactions = await runtime.getAgentRateTransactionEntries(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey);
        }
        catch (_error) {
            agentRateTransaction.transactions = [];
        }
    }
    else {
        agentRateTransaction.transactions = [];
    }
    runtime.spCoinLogger.logExitFunction();
    return agentRateTransaction;
}

