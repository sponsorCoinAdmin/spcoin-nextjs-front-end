import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
  title: 'setCacheTraceMode',
  params: [
    {
      label: 'Trace Cache',
      placeholder: 'false',
      type: 'bool',
      optional: true,
    },
  ],
};

export default methodDef;
