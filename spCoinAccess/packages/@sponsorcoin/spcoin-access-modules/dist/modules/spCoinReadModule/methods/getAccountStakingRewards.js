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
    const accountRewardsStr = typeof accountRewardsValue === 'string'
        ? accountRewardsValue
        : [
            accountRewardsValue.sponsorRewardsList?.stakingRewards ?? 0,
            accountRewardsValue.recipientRewardsList?.stakingRewards ?? 0,
            accountRewardsValue.agentRewardsList?.stakingRewards ?? 0,
        ].join(",");
    const accountRewardList = accountRewardsStr.split(",");
    rewardsRecord.sponsorRewardsList = await runtime.getRewardTypeRecord(_accountKey, SPONSOR, accountRewardList[0]);
    rewardsRecord.recipientRewardsList = await runtime.getRewardTypeRecord(_accountKey, RECIPIENT, accountRewardList[1]);
    rewardsRecord.agentRewardsList = await runtime.getRewardTypeRecord(_accountKey, AGENT, accountRewardList[2]);
    runtime.spCoinLogger.logExitFunction();
    return rewardsRecord;
}
