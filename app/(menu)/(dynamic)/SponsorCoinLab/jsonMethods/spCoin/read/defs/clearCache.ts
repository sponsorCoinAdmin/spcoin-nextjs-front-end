import type { MethodDef } from '../../../shared/types';

export const methodDef: MethodDef = {
  title: 'clearCache',
  params: [
    {
      label: 'Trace Cache',
      placeholder: 'false',
      type: 'bool',
    },
  ],
};

export default methodDef;
