// @ts-nocheck
import { RECIPIENT, burnAddress } from "../shared";
export const depositRecipientStakingRewards = async (context, _sponsorAccount, _recipientAccount, _recipientRate, _amount) => {
    context.spCoinLogger.logFunctionHeader("depositRecipientStakingRewards = async(" +
        _sponsorAccount + ", " +
        _recipientAccount + ", " +
        _recipientRate + ", " +
        _amount + ")");
    const tx = await context.spCoinContractDeployed.depositStakingRewards(RECIPIENT, _sponsorAccount, _recipientAccount, _recipientRate, burnAddress, 0, _amount);
    context.spCoinLogger.logExitFunction();
    return tx;
};
