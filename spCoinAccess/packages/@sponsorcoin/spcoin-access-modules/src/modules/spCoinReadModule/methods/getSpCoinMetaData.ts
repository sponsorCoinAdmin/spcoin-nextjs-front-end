// @ts-nocheck
export async function getSpCoinMetaData(context) {
    context.spCoinLogger.logFunctionHeader("getSpCoinMetaData()");
    const normalizeRangeTuple = (value) => {
        if (Array.isArray(value)) {
            return [Number(value?.[0] ?? 0), Number(value?.[1] ?? 0)];
        }
        return [0, Number(value ?? 0)];
    };
    const getRateRangeTuple = async (rangeReader, lowerReader, upperReader) => {
        const rangeFn = context.spCoinContractDeployed?.[rangeReader];
        if (typeof rangeFn === "function") {
            const rangeResult = await rangeFn.call(context.spCoinContractDeployed);
            return normalizeRangeTuple(rangeResult);
        }
        const lowerFn = context.spCoinContractDeployed?.[lowerReader];
        const upperFn = context.spCoinContractDeployed?.[upperReader];
        if (typeof lowerFn === "function" && typeof upperFn === "function") {
            const [lowerRate, upperRate] = await Promise.all([
                lowerFn.call(context.spCoinContractDeployed),
                upperFn.call(context.spCoinContractDeployed),
            ]);
            return [Number(lowerRate ?? 0), Number(upperRate ?? 0)];
        }
        return [0, 0];
    };
    if (typeof context.spCoinContractDeployed.getSpCoinMetaData === "function") {
        const ret = await context.spCoinContractDeployed.getSpCoinMetaData();
        const [recipientRateRange, agentRateRange] = await Promise.all([
            getRateRangeTuple("getRecipientRateRange", "getLowerRecipientRate", "getUpperRecipientRate"),
            getRateRangeTuple("getAgentRateRange", "getLowerAgentRate", "getUpperAgentRate"),
        ]);
        context.spCoinLogger.logExitFunction();
        return {
            owner: String(ret?.[0] ?? ""),
            version: String(ret?.[1] ?? ""),
            name: String(ret?.[2] ?? ""),
            symbol: String(ret?.[3] ?? ""),
            decimals: Number(ret?.[4] ?? 0),
            totalSupply: String(ret?.[5] ?? "0"),
            inflationRate: Number(ret?.[6] ?? 0),
            recipientRateRange,
            agentRateRange,
        };
    }
    const readOptionalValue = async (readers, fallbackValue) => {
        for (const reader of readers) {
            const contractReader = context.spCoinContractDeployed?.[reader];
            if (typeof contractReader !== "function")
                continue;
            try {
                return await contractReader.call(context.spCoinContractDeployed);
            }
            catch (_error) {
                continue;
            }
        }
        return fallbackValue;
    };
    const [owner, version, name, symbol, decimals, totalSupply, inflationRate, recipientRateRange, agentRateRange] = await Promise.all([
        readOptionalValue(["owner", "getRootAdmin"], ""),
        readOptionalValue(["getVersion"], ""),
        readOptionalValue(["name"], ""),
        readOptionalValue(["symbol"], ""),
        readOptionalValue(["decimals"], 0),
        readOptionalValue(["totalSupply"], "0"),
        readOptionalValue(["getInflationRate"], 10),
        getRateRangeTuple("getRecipientRateRange", "getLowerRecipientRate", "getUpperRecipientRate"),
        getRateRangeTuple("getAgentRateRange", "getLowerAgentRate", "getUpperAgentRate"),
    ]);
    context.spCoinLogger.logExitFunction();
    return {
        owner: String(owner ?? ""),
        version: String(version ?? ""),
        name: String(name ?? ""),
        symbol: String(symbol ?? ""),
        decimals: Number(decimals ?? 0),
        totalSupply: String(totalSupply ?? "0"),
        inflationRate: Number(inflationRate ?? 0),
        recipientRateRange: normalizeRangeTuple(recipientRateRange),
        agentRateRange: normalizeRangeTuple(agentRateRange),
    };
}

