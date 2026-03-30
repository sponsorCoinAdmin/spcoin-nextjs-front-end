// @ts-nocheck
export async function getRecipientRateAgentList(context, _sponsorKey, _recipientKey, _recipientRateKey) {
    context.spCoinLogger.logFunctionHeader("getRecipientRateAgentList = async(" + _sponsorKey + ", " + _recipientKey + ", " + _recipientRateKey + ")");
    let agentAccountList = [];
    try {
        agentAccountList = await context.spCoinContractDeployed.getRecipientRateAgentList(_sponsorKey, _recipientKey, _recipientRateKey);
    }
    catch (_error) {
        agentAccountList = [];
    }
    context.spCoinLogger.logExitFunction();
    return agentAccountList;
}
