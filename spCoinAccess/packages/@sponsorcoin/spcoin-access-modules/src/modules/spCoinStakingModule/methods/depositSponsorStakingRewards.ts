// @ts-nocheck
import { SPONSOR } from "../shared";
export const depositSponsorStakingRewards = async (context, _sponsorAccount, _recipientAccount, _recipientRate, _amount) => {
    context.spCoinLogger.logFunctionHeader("depositSponsorStakingRewards = async(" +
        _sponsorAccount + ", " +
        _recipientAccount + ", " +
        _recipientRate + ", " +
        _amount + ")");
    const tx = await context.spCoinContractDeployed.depositStakingRewards(SPONSOR, _sponsorAccount, _recipientAccount, _recipientRate, _sponsorAccount, 0, _amount);
    context.spCoinLogger.logExitFunction();
    return tx;
};

