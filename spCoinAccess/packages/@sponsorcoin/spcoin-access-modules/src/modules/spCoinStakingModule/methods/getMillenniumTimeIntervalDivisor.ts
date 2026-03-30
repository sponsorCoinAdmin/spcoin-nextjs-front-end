// @ts-nocheck
import { bigIntToDecString } from "../../../utils//dateTime";
export const getMillenniumTimeIntervalDivisor = async (context, _timeInSeconds) => {
    const annualizedPercentage = await context.spCoinContractDeployed.connect(context.signer).getMillenniumTimeIntervalDivisor(_timeInSeconds);
    return bigIntToDecString(annualizedPercentage);
};

