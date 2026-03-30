// @ts-nocheck
import { BURN_ADDRESS } from "../shared";
export const addBackDatedSponsorship = async (context, _adminSigner, _sponsorKey, _recipientKey, _recipientRateKey, _transactionQty, _transactionBackDate) => {
    console.log("addBackDatedSponsorship = async(" +
        _adminSigner + ", " +
        _sponsorKey + ", " +
        _recipientKey + ", " +
        _recipientRateKey + ", " +
        _transactionQty + ", " +
        _transactionBackDate + ")");
    await context.addBackDatedAgentSponsorship(_adminSigner, _sponsorKey, _recipientKey, _recipientRateKey, BURN_ADDRESS, 0, _transactionQty, _transactionBackDate);
    context.spCoinLogger.logExitFunction();
};
