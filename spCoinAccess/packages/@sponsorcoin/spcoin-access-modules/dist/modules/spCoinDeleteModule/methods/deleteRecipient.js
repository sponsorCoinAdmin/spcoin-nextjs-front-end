// @ts-nocheck
export const deleteRecipient = async (context, _sponsorKey, _recipientKey) => {
    context.spCoinLogger.logFunctionHeader("deleteRecipient(" + _sponsorKey.accountKey + ", " + _recipientKey + ")");
    const signerAddress =
        typeof context?.signer?.getAddress === "function"
            ? await context.signer.getAddress()
            : String(context?.signer?.address || "");
    context.spCoinLogger.logDetail("JS => deleteRecipient signer = " + String(signerAddress || "(missing)"));
    context.spCoinLogger.logDetail("JS => deleteRecipient stage = use-bound-contract");
    context.spCoinLogger.logDetail("JS => deleteRecipient stage = send");
    const tx = await context.spCoinContractDeployed.connect(context.signer).deleteRecipient(_sponsorKey.accountKey, _recipientKey);
    context.spCoinLogger.logDetail("JS => deleteRecipient tx hash = " + String(tx?.hash || ""));
    context.spCoinLogger.logExitFunction();
    return tx;
};

export const delRecipient = deleteRecipient;
