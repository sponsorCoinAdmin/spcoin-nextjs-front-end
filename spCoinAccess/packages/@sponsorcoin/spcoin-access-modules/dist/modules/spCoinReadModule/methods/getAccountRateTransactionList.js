// @ts-nocheck
import { RewardRateStruct } from "../../../dataTypes/spCoinDataTypes";
import { bigIntToDecString } from "../../../utils/dateTime";
export function getAccountRateTransactionList(context, rateRewardList) {
    const runtime = context;
    runtime.spCoinLogger.logFunctionHeader("getAccountRateTransactionList = (" + rateRewardList + ")");
    if (!Array.isArray(rateRewardList) || rateRewardList.length === 0) {
        runtime.spCoinLogger.logExitFunction();
        return [];
    }
    const rateList = [];
    for (let idx = rateRewardList.length - 1; idx >= 0; idx--) {
        const rateReward = rateRewardList[idx];
        const rewardRateTransaction = new RewardRateStruct();
        const rateRewardTransactions = rateReward.split("\n");
        const rateRewardHeaderFields = (rateRewardTransactions.shift() ?? "").split(",");
        rewardRateTransaction.rate = bigIntToDecString(rateRewardHeaderFields[0]);
        rewardRateTransaction.stakingRewards = bigIntToDecString(rateRewardHeaderFields[1]);
        rewardRateTransaction.rewardTransactionList = runtime.getRateTransactionList(rateRewardTransactions);
        rateList.push(rewardRateTransaction);
    }
    runtime.spCoinLogger.logExitFunction();
    return rateList;
}
