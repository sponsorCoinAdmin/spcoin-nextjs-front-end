// @ts-nocheck
import { splitRawQuantityParts } from "../shared";

export const addAgentTransaction = async (
    context,
    _sponsorKey,
    _recipientKey,
    _recipientRateKey,
    _accountAgentKey,
    _agentRateKey,
    _transactionQty
) => {
    context.spCoinLogger.logFunctionHeader(
        "addAgentTransaction = async(" +
            _sponsorKey + ", " +
            _recipientKey + ", " +
            _recipientRateKey + ", " +
            _accountAgentKey + ", " +
            _agentRateKey + ", " +
            _transactionQty + ")"
    );
    const { wholePart, fractionalPart } = await splitRawQuantityParts(context, _transactionQty);
    const contractMethod = context.spCoinContractDeployed.addAgentTransaction
        ?? context.spCoinContractDeployed.addAgentTransaction;
    const tx = await contractMethod(
        _sponsorKey,
        _recipientKey,
        _recipientRateKey,
        _accountAgentKey,
        _agentRateKey,
        wholePart,
        fractionalPart
    );
    context.spCoinLogger.logExitFunction();
    return tx;
};
