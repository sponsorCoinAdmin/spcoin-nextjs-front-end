// @ts-nocheck
import { RecipientRateStruct } from "../../../dataTypes/spCoinDataTypes";
import { bigIntToDateTimeString, bigIntToDecString } from "../../../utils/dateTime";
export async function getRecipientRateTransaction(context, _sponsorKey, _recipientKey, _recipientRateKey) {
    const runtime = context;
    runtime.spCoinLogger.logFunctionHeader("getRecipientRateTransaction(" + _sponsorKey + _recipientKey + ", " + _recipientRateKey + ")");
    const recipientRateTransaction = new RecipientRateStruct();
    let inserted = false;
    let recordStr = ["0", "0", "0"];
    try {
        const core = await runtime.spCoinContractDeployed.getRecipientRateTransactionCore(_sponsorKey, _recipientKey, _recipientRateKey);
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
            recordStr = await runtime.spCoinSerialize.getRecipientRateTransactionFields(_sponsorKey, _recipientKey, _recipientRateKey);
            inserted = !((recordStr[0] || "0") === "0" && (recordStr[1] || "0") === "0" && (recordStr[2] || "0") === "0");
        }
        catch (_error) {
            inserted = false;
            recordStr = ["0", "0", "0"];
        }
    }
    let agentKeys = [];
    try {
        agentKeys = await runtime.getRecipientRateAgentList(_sponsorKey, _recipientKey, _recipientRateKey);
    }
    catch (_error) {
        agentKeys = [];
    }
    recipientRateTransaction.recipientRate = _recipientRateKey;
    recipientRateTransaction.inserted = inserted;
    recipientRateTransaction.creationTime = inserted ? bigIntToDateTimeString(recordStr[0]) : "";
    recipientRateTransaction.lastUpdateTime = inserted ? bigIntToDateTimeString(recordStr[1]) : "";
    recipientRateTransaction.stakedSPCoins = bigIntToDecString(recordStr[2]);
    if (inserted) {
        try {
            recipientRateTransaction.transactions = await runtime.getRecipientRateTransactionEntries(_sponsorKey, _recipientKey, _recipientRateKey);
        }
        catch (_error) {
            recipientRateTransaction.transactions = [];
        }
    }
    else {
        recipientRateTransaction.transactions = [];
    }
    try {
        recipientRateTransaction.agentKeys = agentKeys;
        recipientRateTransaction.agentRecordList = await runtime.getAgentRecordList(_sponsorKey, _recipientKey, _recipientRateKey, agentKeys);
    }
    catch (_error) {
        recipientRateTransaction.agentKeys = [];
        recipientRateTransaction.agentRecordList = [];
    }
    runtime.spCoinLogger.logExitFunction();
    return recipientRateTransaction;
}

