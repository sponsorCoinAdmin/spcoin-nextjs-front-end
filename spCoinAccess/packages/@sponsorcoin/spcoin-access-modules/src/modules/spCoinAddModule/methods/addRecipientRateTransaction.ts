// @ts-nocheck
import { splitRawQuantityParts } from "../shared";

export const addRecipientRateTransaction = async (context, _sponsorKey, _recipientKey, _recipientRateKey, _transactionQty) => {
    context.spCoinLogger.logFunctionHeader(
        "addRecipientTransaction = async(" + _sponsorKey + ", " + _recipientKey + ", " + _recipientRateKey + ", " + _transactionQty + ")"
    );
    const { wholePart, fractionalPart } = await splitRawQuantityParts(context, _transactionQty);
    const contractMethod = context.spCoinContractDeployed.addRecipientTransaction
        ?? context.spCoinContractDeployed.addRecipientTransaction;
    const tx = await contractMethod(
        _sponsorKey,
        _recipientKey,
        _recipientRateKey,
        wholePart,
        fractionalPart
    );
    context.spCoinLogger.logExitFunction();
    return tx;
};
