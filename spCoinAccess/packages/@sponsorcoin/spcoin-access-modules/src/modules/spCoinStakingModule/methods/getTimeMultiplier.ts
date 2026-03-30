// @ts-nocheck
export const getTimeMultiplier = async (context, _timeRateMultiplier) => {
    const timeRateMultiplier = await context.spCoinContractDeployed.getTimeMultiplier(_timeRateMultiplier);
    context.spCoinLogger.logExitFunction();
    return timeRateMultiplier;
};

