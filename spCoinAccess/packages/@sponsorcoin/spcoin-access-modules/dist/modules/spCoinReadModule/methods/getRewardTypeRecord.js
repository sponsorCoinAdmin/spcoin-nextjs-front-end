// @ts-nocheck
import { RewardTypeStruct } from "../../../dataTypes/spCoinDataTypes";
import { bigIntToDecString } from "../../../utils/dateTime";
import { getRewardType, getSourceTypeDelimiter } from "../shared";
export async function getRewardTypeRecord(context, _accountKey, _rewardType, _reward) {
    const runtime = context;
    const rewardTypeRecord = new RewardTypeStruct();
    rewardTypeRecord.TYPE = getRewardType(_rewardType);
    rewardTypeRecord.stakingRewards = bigIntToDecString(_reward);
    let rewardAccountList;
    let rewardsStr = "";
    try {
        rewardsStr = await runtime.spCoinContractDeployed.getRewardAccounts(_accountKey, _rewardType);
    }
    catch (_error) {
        rewardsStr = "";
    }
    if (rewardsStr.length > 0) {
        rewardAccountList = rewardsStr.split(getSourceTypeDelimiter(_rewardType) ?? "");
        rewardTypeRecord.rewardAccountList = runtime.getAccountRewardTransactionList(rewardAccountList);
    }
    else
        rewardAccountList = [];
    runtime.spCoinLogger.logExitFunction();
    return rewardTypeRecord;
}
