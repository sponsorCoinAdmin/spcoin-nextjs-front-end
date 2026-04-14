// @ts-nocheck
function stringifyBigIntSafe(value) {
    return JSON.stringify(value, (_key, candidate) =>
        typeof candidate === "bigint" ? candidate.toString() : candidate
    );
}

export async function getRecipientRateList(context, _sponsorKey, _recipientKey) {
    context.spCoinLogger.logFunctionHeader("getRecipientRateList = async(" + _sponsorKey + "," + _recipientKey + ")");
    try {
        const runner = context?.spCoinContractDeployed?.runner;
        const provider = runner?.provider || runner;
        const providerType =
            provider?.constructor?.name ||
            runner?.constructor?.name ||
            typeof provider;
        const candidateUrl =
            provider?._getConnection?.()?.url ||
            provider?.connection?.url ||
            provider?._connection?.url ||
            runner?._getConnection?.()?.url ||
            runner?.connection?.url ||
            runner?._connection?.url ||
            "";
        context.spCoinLogger.logDetail("JS => getRecipientRateList provider = " + String(providerType || "(unknown)"));
        context.spCoinLogger.logDetail("JS => getRecipientRateList providerUrl = " + String(candidateUrl || "(unavailable)"));
        context.spCoinLogger.logDetail("JS => getRecipientRateList stage = send");
        const networkRateKeys = await context.spCoinContractDeployed.getRecipientRateList(_sponsorKey, _recipientKey);
        context.spCoinLogger.logDetail("JS => getRecipientRateList raw = " + stringifyBigIntSafe(networkRateKeys));
        const recipientRateList = [];
        for (const [, netWorkRateKey] of Object.entries(networkRateKeys)) {
            recipientRateList.push(netWorkRateKey);
        }
        context.spCoinLogger.logDetail("JS => getRecipientRateList normalized = " + stringifyBigIntSafe(recipientRateList));
        context.spCoinLogger.logExitFunction();
        return recipientRateList;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const runner = context?.spCoinContractDeployed?.runner;
        const provider = runner?.provider || runner;
        const providerType =
            provider?.constructor?.name ||
            runner?.constructor?.name ||
            typeof provider;
        const candidateUrl =
            provider?._getConnection?.()?.url ||
            provider?.connection?.url ||
            provider?._connection?.url ||
            runner?._getConnection?.()?.url ||
            runner?.connection?.url ||
            runner?._connection?.url ||
            "";
        context.spCoinLogger.logDetail("JS => getRecipientRateList failed provider = " + String(providerType || "(unknown)"));
        context.spCoinLogger.logDetail("JS => getRecipientRateList failed providerUrl = " + String(candidateUrl || "(unavailable)"));
        context.spCoinLogger.logDetail("JS => getRecipientRateList failed = " + message);
        throw new Error("getRecipientRateList(" + _sponsorKey + "," + _recipientKey + ") failed: " + message);
    }
}

