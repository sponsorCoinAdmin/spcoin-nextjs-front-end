// @ts-nocheck
import { AGENT } from "../shared";
export const depositAgentStakingRewards = async (context, _sponsorAccount, _recipientAccount, _recipientRate, _agentAccount, _agentRate, _amount) => {
    context.spCoinLogger.logFunctionHeader("depositAgentStakingRewards = async(" +
        _recipientAccount + ", " +
        _agentAccount + ", " +
        _agentRate + ", " +
        _amount + ")");
    const tx = await context.spCoinContractDeployed.depositStakingRewards(AGENT, _sponsorAccount, _recipientAccount, _recipientRate, _agentAccount, _agentRate, _amount);
    context.spCoinLogger.logExitFunction();
    return tx;
};
