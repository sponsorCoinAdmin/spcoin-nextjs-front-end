import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
  title: 'setRecipientRateRange',
  params: [
    { label: 'New Lower Recipient Rate', placeholder: 'uint lower recipient rate', type: 'uint' },
    { label: 'New Upper Recipient Rate', placeholder: 'uint upper recipient rate', type: 'uint' },
  ],
};

export default methodDef;
