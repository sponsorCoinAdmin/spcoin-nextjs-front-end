import { RecipientRateStruct } from "../../../dataTypes/spCoinDataTypes";
import { bigIntToDateTimeString, bigIntToDecString } from "../../../utils/dateTime";
export async function getRecipientRateRecord(context, _sponsorKey, _recipientKey, _recipientRateKey) {
    const runtime = context;
    runtime.spCoinLogger.logFunctionHeader("getRecipientRateRecord(" + _sponsorKey + _recipientKey + ", " + _recipientRateKey + ")");
    const recipientRateRecord = new RecipientRateStruct();
    const recordStr = await runtime.spCoinSerialize.getRecipientRateRecordFields(_sponsorKey, _recipientKey, _recipientRateKey);
    let agentAccountList = [];
    try {
        agentAccountList = await runtime.getRecipientRateAgentList(_sponsorKey, _recipientKey, _recipientRateKey);
    }
    catch (_error) {
        agentAccountList = [];
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
        recipientRateRecord.agentRecordList = await runtime.getAgentRecordList(_sponsorKey, _recipientKey, _recipientRateKey, agentAccountList);
    }
    catch (_error) {
        recipientRateRecord.agentRecordList = [];
    }
    runtime.spCoinLogger.logExitFunction();
    return recipientRateRecord;
}
