import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
  title: 'addOffChainRecipients',
  params: [
    { label: 'Account Key', placeholder: 'address _accountKey', type: 'address' },
    { label: 'Recipient Account List', placeholder: 'address[] _recipientAccountList (comma/newline separated)', type: 'address_array' },
  ],
};

export default methodDef;
