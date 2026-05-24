import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
  title: 'backDateRateTransactionSet',
  params: [
    { label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' },
    { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
    { label: 'Recipient Rate Key', placeholder: 'uint256 _recipientRateKey', type: 'uint' },
    { label: 'Agent Key', placeholder: 'address _agentKey; blank for recipient rate bucket', type: 'address' },
    { label: 'Agent Rate Key', placeholder: 'uint256 _agentRateKey; blank for recipient rate bucket', type: 'uint' },
    { label: 'Set Bucket Rate Key', placeholder: 'bytes32 _setBucketRateKey', type: 'string' },
    { label: 'Last Update Timestamp', placeholder: 'Select date', type: 'date' },
  ],
};

export default methodDef;
