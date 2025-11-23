// File: @/lib/context/hooks/index.ts

/**
 * @file Hooks barrel (does not re-export other barrels).
 */

export * from './nestedHooks/useAmounts';
export * from './nestedHooks/useApiProvider';
export * from './nestedHooks/useErrorMessages';
export * from './nestedHooks/useExchangeTokenBalances';
export * from './nestedHooks/useNetwork';
export * from './nestedHooks/useSlippage';
export * from './nestedHooks/useTradeDirection';


// Concrete file in this folder:
export * from './nestedHooks/useTokenContracts'; // provides useSellTokenContract/useBuyTokenContract

// Panel-tree visibility API (concrete file, not a barrel)
export * from '../exchangeContext/hooks/usePanelTree';

// Named re-export (concrete file, not a barrel)
export * from './nestedHooks/useAppChainId';

import { useContext } from 'react';
import { ExchangeContextState } from '../ExchangeProvider';

export const useExchangeContext = () => {
  const context = useContext(ExchangeContextState);
  if (!context) {
    throw new Error('❌ useExchangeContext must be used within an ExchangeProvider');
  }
  return context;
};
