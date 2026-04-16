import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
  title: 'deleteRecipientTransaction',
  params: [
    { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
    { label: 'Recipient Rate Key', placeholder: 'uint256 _recipientRateKey', type: 'uint' },
  ],
};

export default methodDef;
