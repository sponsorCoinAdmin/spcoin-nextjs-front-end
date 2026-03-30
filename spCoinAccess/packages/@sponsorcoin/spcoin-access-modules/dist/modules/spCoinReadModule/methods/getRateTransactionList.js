import { RewardTransactionStruct } from "../../../dataTypes/spCoinDataTypes";
import { bigIntToDateTimeString, bigIntToDecString } from "../../../utils/dateTime";
export function getRateTransactionList(context, rewardRateRowList) {
    const rateTransactionList = [];
    for (let row = rewardRateRowList.length - 1; row >= 0; row--) {
        const accountRewardsFields = rewardRateRowList[row].split(",");
        const rewardTransactionRecord = new RewardTransactionStruct();
        let count = 0;
        rewardTransactionRecord.updateTime = bigIntToDateTimeString(accountRewardsFields[count++]);
        rewardTransactionRecord.stakingRewards = bigIntToDecString(accountRewardsFields[count++]);
        rateTransactionList.push(rewardTransactionRecord);
    }
    context.spCoinLogger.logExitFunction();
    return rateTransactionList;
}
