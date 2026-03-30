export const deleteAccountRecord = async (context, _accountKey) => {
    context.spCoinLogger.logFunctionHeader("deleteAccountRecord = async(" + _accountKey + ")");
    context.spCoinLogger.logDetail("JS => Deleting Account " + _accountKey + " From Blockchain Network");
    const tx = await context.spCoinContractDeployed.connect(context.signer).deleteAccountRecord(_accountKey);
    context.spCoinLogger.logExitFunction();
    return tx;
};
