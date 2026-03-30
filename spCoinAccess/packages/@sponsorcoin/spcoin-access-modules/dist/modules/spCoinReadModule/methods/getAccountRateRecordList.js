import { RewardRateStruct } from "../../../dataTypes/spCoinDataTypes";
import { bigIntToDecString } from "../../../utils/dateTime";
export function getAccountRateRecordList(context, rateRewardList) {
    const runtime = context;
    runtime.spCoinLogger.logFunctionHeader("getAccountRateRecordList = (" + rateRewardList + ")");
    const rateList = [];
    for (let idx = rateRewardList.length - 1; idx >= 0; idx--) {
        const rateReward = rateRewardList[idx];
        const rewardRateRecord = new RewardRateStruct();
        const rateRewardTransactions = rateReward.split("\n");
        const rateRewardHeaderFields = (rateRewardTransactions.shift() ?? "").split(",");
        rewardRateRecord.rate = bigIntToDecString(rateRewardHeaderFields[0]);
        rewardRateRecord.stakingRewards = bigIntToDecString(rateRewardHeaderFields[1]);
        rewardRateRecord.rewardTransactionList = runtime.getRateTransactionList(rateRewardTransactions);
        rateList.push(rewardRateRecord);
    }
    runtime.spCoinLogger.logExitFunction();
    return rateList;
}
