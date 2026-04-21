// @ts-nocheck
import { RecipientRateStruct } from "../../../dataTypes/spCoinDataTypes";
import { bigIntToDateTimeString, bigIntToDecString } from "../../../utils/dateTime";
export async function getRecipientTransaction(context, _sponsorKey, _recipientKey, _recipientRateKey) {
    const runtime = context;
    runtime.spCoinLogger.logFunctionHeader("getRecipientTransaction(" + _sponsorKey + _recipientKey + ", " + _recipientRateKey + ")");
    const recipientTransaction = new RecipientRateStruct();
    let inserted = false;
    let recordStr = ["0", "0", "0"];
    try {
        const core = await runtime.spCoinContractDeployed.getRecipientTransactionCore(_sponsorKey, _recipientKey, _recipientRateKey);
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
            recordStr = await runtime.spCoinSerialize.getRecipientTransactionFields(_sponsorKey, _recipientKey, _recipientRateKey);
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
    recipientTransaction.recipientRate = _recipientRateKey;
    recipientTransaction.inserted = inserted;
    recipientTransaction.creationTime = inserted ? bigIntToDateTimeString(recordStr[0]) : "";
    recipientTransaction.lastUpdateTime = inserted ? bigIntToDateTimeString(recordStr[1]) : "";
    recipientTransaction.stakedSPCoins = bigIntToDecString(recordStr[2]);
    if (inserted) {
        try {
            recipientTransaction.transactions = await runtime.getRecipientTransactionEntries(_sponsorKey, _recipientKey, _recipientRateKey);
        }
        catch (_error) {
            recipientTransaction.transactions = [];
        }
    }
    else {
        recipientTransaction.transactions = [];
    }
    try {
        recipientTransaction.agentKeys = agentKeys;
        recipientTransaction.agentRecordList = await runtime.getAgentRecordList(_sponsorKey, _recipientKey, _recipientRateKey, agentKeys);
    }
    catch (_error) {
        recipientTransaction.agentKeys = [];
        recipientTransaction.agentRecordList = [];
    }
    runtime.spCoinLogger.logExitFunction();
    return recipientTransaction;
}

