import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
  title: 'addOffChainAgents',
  params: [
    { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
    { label: 'Recipient Rate Key', placeholder: 'uint256 _recipientRateKey', type: 'uint' },
    { label: 'Agent Account List', placeholder: 'address[] _agentAccountList (comma/newline separated)', type: 'address_array' },
  ],
};

export default methodDef;
