// @ts-nocheck
import { RecipientRateStruct } from "../../../dataTypes/spCoinDataTypes";
import { bigIntToDateTimeString, bigIntToDecString } from "../../../utils/dateTime";
export async function getRecipientTransaction(context, _sponsorKey, _recipientKey, _recipientRateKey) {
    const runtime = context;
    runtime.spCoinLogger.logFunctionHeader("getRecipientTransaction(" + _sponsorKey + _recipientKey + ", " + _recipientRateKey + ")");
    const recipientTransaction = new RecipientRateStruct();
    const recordStr = await runtime.spCoinSerialize.getRecipientTransactionFields(_sponsorKey, _recipientKey, _recipientRateKey);
    let agentAccountList = [];
    try {
        agentAccountList = await runtime.getRecipientRateAgentList(_sponsorKey, _recipientKey, _recipientRateKey);
    }
    catch (_error) {
        agentAccountList = [];
    }
    recipientTransaction.recipientRate = _recipientRateKey;
    recipientTransaction.creationTime = bigIntToDateTimeString(recordStr[0]);
    recipientTransaction.lastUpdateTime = bigIntToDateTimeString(recordStr[1]);
    recipientTransaction.stakedSPCoins = bigIntToDecString(recordStr[2]);
    try {
        recipientTransaction.transactions = await runtime.getRecipientTransactionList(_sponsorKey, _recipientKey, _recipientRateKey);
    }
    catch (_error) {
        recipientTransaction.transactions = [];
    }
    try {
        recipientTransaction.agentRecordList = await runtime.getAgentRecordList(_sponsorKey, _recipientKey, _recipientRateKey, agentAccountList);
    }
    catch (_error) {
        recipientTransaction.agentRecordList = [];
    }
    runtime.spCoinLogger.logExitFunction();
    return recipientTransaction;
}
