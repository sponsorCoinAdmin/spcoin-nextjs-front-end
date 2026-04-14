// @ts-nocheck
export const addAgents = async (context, _sponsorKey, _recipientKey, _recipientRateKey, _agentAccountList) => {
    context.spCoinLogger.logFunctionHeader("addAgents = async(" + _sponsorKey + ", " + _recipientKey + ", " + _recipientRateKey + ", " + _agentAccountList + ")");
    context.spCoinLogger.logDetail("JS => For Recipient[" + _recipientKey + "]: " + _recipientKey + ")");
    context.spCoinLogger.logDetail("JS => Inserting " + _agentAccountList.length + " Agent To Blockchain Network");
    context.spCoinLogger.logDetail("JS => _agentAccountList = " + _agentAccountList);
    const agentSize = _agentAccountList.length;
    context.spCoinLogger.logDetail("JS => agentSize.length = " + agentSize);
    let agentCount = 0;
    for (agentCount = 0; agentCount < agentSize; agentCount++) {
        const agentKey = _agentAccountList[agentCount];
        context.spCoinLogger.logDetail("JS =>  " + agentCount + ". " + "Inserting Agent[" + agentCount + "]: " + agentKey);
        await context.addRecipientAgentBranch(_sponsorKey, _recipientKey, _recipientRateKey, agentKey);
    }
    context.spCoinLogger.logDetail("JS => " + "Inserted = " + agentSize + " Agent Records");
    context.spCoinLogger.logExitFunction();
    return agentCount;
};

