import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
  title: 'deleteRecipientSponsorship',
  params: [
    { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
  ],
};

export default methodDef;
