// @ts-nocheck
import { RecipientRateStruct } from "../../../dataTypes/spCoinDataTypes";
import { bigIntToDateTimeString, bigIntToDecString } from "../../../utils/dateTime";
export async function getRecipientRateRecord(context, _sponsorKey, _recipientKey, _recipientRateKey) {
    const runtime = context;
    runtime.spCoinLogger.logFunctionHeader("getRecipientRateRecord(" + _sponsorKey + _recipientKey + ", " + _recipientRateKey + ")");
    const recipientRateRecord = new RecipientRateStruct();
    const recordStr = await runtime.spCoinSerialize.getRecipientRateRecordFields(_sponsorKey, _recipientKey, _recipientRateKey);
    let agentKeys = [];
    try {
        agentKeys = await runtime.getRecipientRateAgentList(_sponsorKey, _recipientKey, _recipientRateKey);
    }
    catch (_error) {
        agentKeys = [];
    }
    recipientRateRecord.recipientRate = _recipientRateKey;
    recipientRateRecord.creationTime = bigIntToDateTimeString(recordStr[0]);
    recipientRateRecord.lastUpdateTime = bigIntToDateTimeString(recordStr[1]);
    recipientRateRecord.stakedSPCoins = bigIntToDecString(recordStr[2]);
    try {
        recipientRateRecord.transactions = await runtime.getRecipientRateTransactionList(_sponsorKey, _recipientKey, _recipientRateKey);
    }
    catch (_error) {
        recipientRateRecord.transactions = [];
    }
    try {
        recipientRateRecord.agentKeys = agentKeys;
        recipientRateRecord.agentRecordList = await runtime.getAgentRecordList(_sponsorKey, _recipientKey, _recipientRateKey, agentKeys);
    }
    catch (_error) {
        recipientRateRecord.agentKeys = [];
        recipientRateRecord.agentRecordList = [];
    }
    runtime.spCoinLogger.logExitFunction();
    return recipientRateRecord;
}

