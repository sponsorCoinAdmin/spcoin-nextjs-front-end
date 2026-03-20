import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
  title: 'setAgentRateRange',
  params: [
    { label: 'New Lower Agent Rate', placeholder: 'uint lower agent rate', type: 'uint' },
    { label: 'New Upper Agent Rate', placeholder: 'uint upper agent rate', type: 'uint' },
  ],
};

export default methodDef;
