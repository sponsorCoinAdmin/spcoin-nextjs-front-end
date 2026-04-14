// @ts-nocheck
import { BURN_ADDRESS } from "../shared";

export const backDateRecipientTransactionDate = async (
    context,
    _adminSigner,
    _sponsorKey,
    _recipientKey,
    _recipientRateKey,
    _transactionIndex,
    _transactionBackDate
) => {
    context.spCoinLogger.logFunctionHeader(
        "backDateRecipientTransactionDate = async(" +
            _sponsorKey + ", " +
            _recipientKey + ", " +
            _recipientRateKey + ", " +
            _transactionIndex + ", " +
            _transactionBackDate + ")"
    );
    const ownerAddress = await context.spCoinContractDeployed.owner();
    const signerAddress = typeof _adminSigner?.getAddress === "function"
        ? await _adminSigner.getAddress()
        : _adminSigner?.address;
    if (!signerAddress || String(signerAddress).toLowerCase() !== String(ownerAddress).toLowerCase()) {
        throw new Error("backdating transaction dates requires the owner signer.");
    }
    const tx = await context.spCoinContractDeployed.backDateTransactionDate(
        _sponsorKey,
        _recipientKey,
        _recipientRateKey,
        BURN_ADDRESS,
        0,
        _transactionIndex,
        _transactionBackDate
    );
    context.spCoinLogger.logExitFunction();
    return tx;
};
