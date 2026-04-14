// @ts-nocheck
import { addBackDatedRecipientRateTransaction } from "./addBackDatedRecipientRateTransaction";

export const addBackDatedSponsorship = async (context, _adminSigner, _sponsorKey, _recipientKey, _recipientRateKey, _transactionQty, _transactionBackDate) => {
    return addBackDatedRecipientRateTransaction(
        context,
        _adminSigner,
        _sponsorKey,
        _recipientKey,
        _recipientRateKey,
        _transactionQty,
        _transactionBackDate
    );
};

