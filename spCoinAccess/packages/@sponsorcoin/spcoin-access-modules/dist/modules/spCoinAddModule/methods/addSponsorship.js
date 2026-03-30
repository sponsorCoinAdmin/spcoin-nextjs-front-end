import { BURN_ADDRESS } from "../shared";
export const addSponsorship = async (context, _sponsorSigner, _recipientKey, _recipientRateKey, _transactionQty) => {
    context.spCoinLogger.logFunctionHeader("addSponsorship = async(" +
        _sponsorSigner + ", " +
        _recipientKey + ", " +
        _recipientRateKey + ", " +
        _transactionQty + ")");
    await context.addAgentSponsorship(_sponsorSigner, _recipientKey, _recipientRateKey, BURN_ADDRESS, 0, _transactionQty);
    context.spCoinLogger.logExitFunction();
};
