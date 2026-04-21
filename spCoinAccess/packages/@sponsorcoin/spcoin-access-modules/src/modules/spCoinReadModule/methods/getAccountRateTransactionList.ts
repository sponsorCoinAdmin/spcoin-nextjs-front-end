// @ts-nocheck
import { RewardRateStruct } from "../../../dataTypes/spCoinDataTypes";
import { bigIntToDecString } from "../../../utils/dateTime";
export function getAccountTransactionList(context, rateRewardList) {
    const runtime = context;
    runtime.spCoinLogger.logFunctionHeader("getAccountTransactionList = (" + rateRewardList + ")");
    if (!Array.isArray(rateRewardList) || rateRewardList.length === 0) {
        runtime.spCoinLogger.logExitFunction();
        return [];
    }
    const rateList = [];
    for (let idx = rateRewardList.length - 1; idx >= 0; idx--) {
        const rateReward = rateRewardList[idx];
        const rewardTransaction = new RewardRateStruct();
        const rateRewardTransactions = rateReward.split("\n");
        const rateRewardHeaderFields = (rateRewardTransactions.shift() ?? "").split(",");
        rewardTransaction.rate = bigIntToDecString(rateRewardHeaderFields[0]);
        rewardTransaction.stakingRewards = bigIntToDecString(rateRewardHeaderFields[1]);
        rewardTransaction.rewardTransactionList = runtime.getTransactionList(rateRewardTransactions);
        rateList.push(rewardTransaction);
    }
    runtime.spCoinLogger.logExitFunction();
    return rateList;
}

