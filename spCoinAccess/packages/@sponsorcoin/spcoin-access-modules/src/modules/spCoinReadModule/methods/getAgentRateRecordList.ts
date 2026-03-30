// @ts-nocheck
export async function getAgentRateRecordList(context, _sponsorKey, _recipientKey, _recipientRateKey, _agentKey) {
    const runtime = context;
    runtime.spCoinLogger.logFunctionHeader("getAgentRateRecordList(" + ", " + _sponsorKey + ", " + _recipientKey + ", " + _recipientRateKey + ", " + _agentKey + ")");
    const agentRateList = await runtime.getAgentRateList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey);
    const agentRateRecordList = [];
    for (const [, agentRateKey] of Object.entries(agentRateList)) {
        const agentRateRecord = await runtime.getAgentRateRecord(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, agentRateKey);
        agentRateRecordList.push(agentRateRecord);
    }
    runtime.spCoinLogger.logExitFunction();
    return agentRateRecordList;
}

