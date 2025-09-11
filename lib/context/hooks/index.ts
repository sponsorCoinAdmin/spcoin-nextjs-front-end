// File: lib/context/hooks/index.ts

/**
 * @file Manually adjusted during panel-tree migration.
 * Keep explicit re-exports. Remove legacy useActiveDisplay.
 */

export * from "./useExchangeContext";
export * from "./nestedHooks/useAmounts";
export * from "./nestedHooks/useApiProvider";
export * from "./nestedHooks/useErrorMessages";
export * from "./nestedHooks/useExchangeTokenBalances";
export * from "./nestedHooks/useNetwork";
export * from "./nestedHooks/useSlippage";
export * from "./nestedHooks/useSpCoinDisplay";
export * from "./nestedHooks/useTokenContracts";
export * from "./nestedHooks/useTradeDirection";
// export * from "./nestedHooks/useActiveDisplay"; // removed

// new panel-tree visibility API
export * from "../exchangeContext/hooks/usePanelTree";

// ✅ correct named re-export (no default export in the source file)
export * from "./nestedHooks/useAppChainId";
