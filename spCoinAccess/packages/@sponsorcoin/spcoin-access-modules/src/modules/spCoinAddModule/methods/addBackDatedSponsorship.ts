// @ts-nocheck
import { addBackDatedRecipientRateAmount } from "./addBackDatedRecipientRateAmount";

export const addBackDatedSponsorship = async (context, _adminSigner, _sponsorKey, _recipientKey, _recipientRateKey, _transactionQty, _transactionBackDate) => {
    return addBackDatedRecipientRateAmount(
        context,
        _adminSigner,
        _sponsorKey,
        _recipientKey,
        _recipientRateKey,
        _transactionQty,
        _transactionBackDate
    );
};

