import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
  title: 'delRecipient',
  params: [
    { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
  ],
};

export default methodDef;
