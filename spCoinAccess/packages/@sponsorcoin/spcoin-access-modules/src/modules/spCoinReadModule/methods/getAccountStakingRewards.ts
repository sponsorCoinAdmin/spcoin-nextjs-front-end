// @ts-nocheck
import { RewardsStruct } from "../../../dataTypes/spCoinDataTypes";
import { AGENT, RECIPIENT, SPONSOR } from "../shared";
export async function getAccountStakingRewards(context, _accountKey) {
    const runtime = context;
    const rewardsRecord = new RewardsStruct();
    try {
        const updateTx = await runtime.spCoinContractDeployed.updateAccountStakingRewards(_accountKey);
        if (updateTx && typeof updateTx.wait === "function") {
            await updateTx.wait();
        }
    }
    catch (_error) {
    }
    const accountRewardsValue = await runtime.spCoinSerialize.getAccountRewardsValue(_accountKey);
    rewardsRecord.sponsorRewardsList = await runtime.getRewardTypeRecord(_accountKey, SPONSOR, accountRewardsValue.sponsorRewards ?? 0);
    rewardsRecord.recipientRewardsList = await runtime.getRewardTypeRecord(_accountKey, RECIPIENT, accountRewardsValue.recipientRewards ?? 0);
    rewardsRecord.agentRewardsList = await runtime.getRewardTypeRecord(_accountKey, AGENT, accountRewardsValue.agentRewards ?? 0);
    runtime.spCoinLogger.logExitFunction();
    return rewardsRecord;
}

