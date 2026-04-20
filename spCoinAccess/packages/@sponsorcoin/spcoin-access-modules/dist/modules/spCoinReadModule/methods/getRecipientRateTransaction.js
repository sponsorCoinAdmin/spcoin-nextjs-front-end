// @ts-nocheck
import { RecipientRateStruct } from "../../../dataTypes/spCoinDataTypes";
import { bigIntToDateTimeString, bigIntToDecString } from "../../../utils/dateTime";
export async function getRecipientRateTransaction(context, _sponsorKey, _recipientKey, _recipientRateKey) {
    const runtime = context;
    runtime.spCoinLogger.logFunctionHeader("getRecipientRateTransaction(" + _sponsorKey + _recipientKey + ", " + _recipientRateKey + ")");
    const recipientRateTransaction = new RecipientRateStruct();
    const recordStr = await runtime.spCoinSerialize.getRecipientRateTransactionFields(_sponsorKey, _recipientKey, _recipientRateKey);
    let agentAccountList = [];
    try {
        agentAccountList = await runtime.getRecipientRateAgentList(_sponsorKey, _recipientKey, _recipientRateKey);
    }
    catch (_error) {
        agentAccountList = [];
    }
    recipientRateTransaction.recipientRate = _recipientRateKey;
    recipientRateTransaction.creationTime = bigIntToDateTimeString(recordStr[0]);
    recipientRateTransaction.lastUpdateTime = bigIntToDateTimeString(recordStr[1]);
    recipientRateTransaction.stakedSPCoins = bigIntToDecString(recordStr[2]);
    try {
        recipientRateTransaction.transactions = await runtime.getRecipientRateTransactionList(_sponsorKey, _recipientKey, _recipientRateKey);
    }
    catch (_error) {
        recipientRateTransaction.transactions = [];
    }
    try {
        recipientRateTransaction.agentRecordList = await runtime.getAgentRecordList(_sponsorKey, _recipientKey, _recipientRateKey, agentAccountList);
    }
    catch (_error) {
        recipientRateTransaction.agentRecordList = [];
    }
    runtime.spCoinLogger.logExitFunction();
    return recipientRateTransaction;
}
