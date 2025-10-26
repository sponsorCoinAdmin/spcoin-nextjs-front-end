// File: lib/context/hooks/ExchangeContext/hooks/useProviderSetters.ts
import type { TRADE_DIRECTION, TokenContract, WalletAccount } from '@/lib/structure';
import type { ExchangeContext as ExchangeContextTypeOnly } from '@/lib/structure';
import { SP_COIN_DISPLAY as SP } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';

type SetExchange = (
  updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly,
  hookName?: string
) => void;

const LOG_TIME = false;
const DEBUG_ENABLED = (process.env.NEXT_PUBLIC_DEBUG_LOG_PROVIDER_SETTERS ?? 'false') === 'true';
const log = createDebugLogger('useProviderSetters', DEBUG_ENABLED, LOG_TIME);

/* ----------------------- helpers: safe comparisons & logs ----------------------- */

function bigIntEq(a?: bigint, b?: bigint) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  return a === b;
}

function strEq(a?: string, b?: string) {
  return (a ?? '') === (b ?? '');
}

function numEq(a?: number, b?: number) {
  return (a ?? NaN) === (b ?? NaN);
}

// Shallow meaningful diff for TokenContract
function hasMeaningfulDiff(prev?: TokenContract, next?: TokenContract): boolean {
  if (!prev && !next) return false;
  if (!prev || !next) return true;

  return !(
    strEq(prev.address as any, next.address as any) &&
    numEq(prev.chainId, next.chainId) &&
    numEq(prev.decimals, next.decimals) &&
    strEq(prev.symbol, next.symbol) &&
    strEq(prev.name, next.name) &&
    strEq((prev as any).logoURL, (next as any).logoURL) &&
    bigIntEq(prev.totalSupply, next.totalSupply) &&
    bigIntEq(prev.amount, next.amount) &&
    bigIntEq(prev.balance, next.balance) &&
    (prev as any).rateRatio === (next as any).rateRatio
  );
}

function summarizeToken(t?: TokenContract) {
  if (!t) return { addr: undefined };
  return {
    addr: String(t.address ?? ''),
    sym: t.symbol ?? '',
    dec: t.decimals ?? undefined,
    chain: t.chainId ?? undefined,
    amount: t.amount?.toString?.(),
    balance: t.balance?.toString?.(),
  };
}

/* --------------------------------- setters --------------------------------- */

export function useProviderSetters(setExchangeContext: SetExchange) {
  /* Accounts */
  const setRecipientAccount = (wallet: WalletAccount | undefined) =>
    setExchangeContext((p) => {
      if (p.accounts.recipientAccount === wallet) {
        log.log?.('[setRecipientAccount] no-op (same reference)');
        return p;
      }
      const next = structuredClone(p);
      next.accounts.recipientAccount = wallet;
      log.log?.('[setRecipientAccount] wrote', wallet?.address);
      return next;
    }, 'setRecipientAccount');

  // ➕ NEW: Agent account (mirror of recipient)
  const setAgentAccount = (wallet: WalletAccount | undefined) =>
    setExchangeContext((p) => {
      if (p.accounts.agentAccount === wallet) {
        log.log?.('[setAgentAccount] no-op (same reference)');
        return p;
      }
      const next = structuredClone(p);
      (next as any).accounts.agentAccount = wallet;
      log.log?.('[setAgentAccount] wrote', wallet?.address);
      return next;
    }, 'setAgentAccount');

  /* Amounts (generic + wrappers) */
  const setAmount = (amount: bigint, panelType: SP.BUY_SELECT_PANEL | SP.SELL_SELECT_PANEL) =>
    setExchangeContext((p) => {
      const next = structuredClone(p);

      if (panelType === SP.SELL_SELECT_PANEL) {
        const curr = next.tradeData.sellTokenContract?.amount;
        if (curr === amount) {
          log.log?.('[setAmount] no-op (SELL same amount)', String(amount));
          return p;
        }
        if (next.tradeData.sellTokenContract) {
          log.log?.('[setAmount][SELL] write', {
            prev: next.tradeData.sellTokenContract.amount?.toString?.(),
            next: amount.toString(),
            token: summarizeToken(next.tradeData.sellTokenContract),
          });
          next.tradeData.sellTokenContract.amount = amount;
        } else {
          log.warn?.('[setAmount][SELL] skipped — no sellTokenContract set yet');
        }
      } else {
        const curr = next.tradeData.buyTokenContract?.amount;
        if (curr === amount) {
          log.log?.('[setAmount] no-op (BUY same amount)', String(amount));
          return p;
        }
        if (next.tradeData.buyTokenContract) {
          log.log?.('[setAmount][BUY] write', {
            prev: next.tradeData.buyTokenContract.amount?.toString?.(),
            next: amount.toString(),
            token: summarizeToken(next.tradeData.buyTokenContract),
          });
          next.tradeData.buyTokenContract.amount = amount;
        } else {
          log.warn?.('[setAmount][BUY] skipped — no buyTokenContract set yet');
        }
      }
      return next;
    }, `setAmount:${panelType === SP.SELL_SELECT_PANEL ? 'SELL' : 'BUY'}`);

  // Thin wrappers (keep public API)
  const setSellAmount = (amount: bigint) => setAmount(amount, SP.SELL_SELECT_PANEL);
  const setBuyAmount  = (amount: bigint) => setAmount(amount, SP.BUY_SELECT_PANEL);

  /* Balances (generic + wrappers) */
  const setBalance = (amount: bigint, panelType: SP.BUY_SELECT_PANEL | SP.SELL_SELECT_PANEL) =>
    setExchangeContext((p) => {
      const next = structuredClone(p);

      if (panelType === SP.SELL_SELECT_PANEL) {
        const curr = next.tradeData.sellTokenContract?.balance;
        if (curr === amount) {
          log.log?.('[setBalance] no-op (SELL same balance)', String(amount));
          return p;
        }
        if (next.tradeData.sellTokenContract) {
          log.log?.('[setBalance][SELL] write', {
            prev: next.tradeData.sellTokenContract.balance?.toString?.(),
            next: amount.toString(),
            token: summarizeToken(next.tradeData.sellTokenContract),
          });
          next.tradeData.sellTokenContract.balance = amount;
        } else {
          log.warn?.('[setBalance][SELL] skipped — no sellTokenContract set yet');
        }
      } else {
        const curr = next.tradeData.buyTokenContract?.balance;
        if (curr === amount) {
          log.log?.('[setBalance] no-op (BUY same balance)', String(amount));
          return p;
        }
        if (next.tradeData.buyTokenContract) {
          log.log?.('[setBalance][BUY] write', {
            prev: next.tradeData.buyTokenContract.balance?.toString?.(),
            next: amount.toString(),
            token: summarizeToken(next.tradeData.buyTokenContract),
          });
          next.tradeData.buyTokenContract.balance = amount;
        } else {
          log.warn?.('[setBalance][BUY] skipped — no buyTokenContract set yet');
        }
      }
      return next;
    }, `setBalance:${panelType === SP.SELL_SELECT_PANEL ? 'SELL' : 'BUY'}`);

  // Thin wrappers (keep public API)
  const setSellBalance = (amount: bigint) => setBalance(amount, SP.SELL_SELECT_PANEL);
  const setBuyBalance  = (amount: bigint) => setBalance(amount, SP.BUY_SELECT_PANEL);

  /**
   * Token contract setters (unchanged logic, but keep the improved diff handling)
   */
  const setSellTokenContract = (contract: TokenContract | undefined) =>
    setExchangeContext((p) => {
      const curr = p.tradeData.sellTokenContract;

      if (curr === contract) {
        log.log?.('[setSellTokenContract] no-op (same reference)', summarizeToken(curr));
        return p;
      }

      if (!hasMeaningfulDiff(curr, contract)) {
        log.log?.('[setSellTokenContract] no-op (no meaningful diff)', {
          curr: summarizeToken(curr),
          next: summarizeToken(contract),
        });
        return p;
      }

      const next = structuredClone(p);
      next.tradeData.sellTokenContract = contract;

      log.log?.('[setSellTokenContract] wrote', {
        prev: summarizeToken(curr),
        next: summarizeToken(contract),
        changed: {
          address: String((curr?.address ?? '') !== (contract?.address ?? '')),
          balance: String(curr?.balance?.toString?.() ?? '') + ' → ' + String(contract?.balance?.toString?.() ?? ''),
          amount: String(curr?.amount?.toString?.() ?? '') + ' → ' + String(contract?.amount?.toString?.() ?? ''),
        },
      });

      return next;
    }, 'setSellTokenContract');

  const setBuyTokenContract = (contract: TokenContract | undefined) =>
    setExchangeContext((p) => {
      const curr = p.tradeData.buyTokenContract;

      if (curr === contract) {
        log.log?.('[setBuyTokenContract] no-op (same reference)', summarizeToken(curr));
        return p;
      }

      if (!hasMeaningfulDiff(curr, contract)) {
        log.log?.('[setBuyTokenContract] no-op (no meaningful diff)', {
          curr: summarizeToken(curr),
          next: summarizeToken(contract),
        });
        return p;
      }

      const next = structuredClone(p);
      next.tradeData.buyTokenContract = contract;

      log.log?.('[setBuyTokenContract] wrote', {
        prev: summarizeToken(curr),
        next: summarizeToken(contract),
        changed: {
          address: String((curr?.address ?? '') !== (contract?.address ?? '')),
          balance: String(curr?.balance?.toString?.() ?? '') + ' → ' + String(contract?.balance?.toString?.() ?? ''),
          amount: String(curr?.amount?.toString?.() ?? '') + ' → ' + String(contract?.amount?.toString?.() ?? ''),
        },
      });

      return next;
    }, 'setBuyTokenContract');

  const setTradeDirection = (type: TRADE_DIRECTION) =>
    setExchangeContext((p) => {
      if (p.tradeData.tradeDirection === type) {
        log.log?.('[setTradeDirection] no-op', type);
        return p;
      }
      const next = structuredClone(p);
      log.log?.('[setTradeDirection] write', { prev: p.tradeData.tradeDirection, next: type });
      next.tradeData.tradeDirection = type;
      return next;
    }, 'setTradeDirection');

  const setSlippageBps = (bps: number) =>
    setExchangeContext((p) => {
      if (p.tradeData.slippage.bps === bps) {
        log.log?.('[setSlippageBps] no-op', bps);
        return p;
      }
      const next = structuredClone(p);
      log.log?.('[setSlippageBps] write', { prev: p.tradeData.slippage.bps, next: bps });
      next.tradeData.slippage.bps = bps;
      return next;
    }, 'setSlippageBps');

  const setAppChainId = (chainId: number) =>
    setExchangeContext((p) => {
      if (p.network.appChainId === chainId) {
        log.log?.('[setAppChainId] no-op', chainId);
        return p;
      }
      const next = structuredClone(p);
      log.log?.('[setAppChainId] write', { prev: p.network.appChainId, next: chainId });
      next.network.appChainId = chainId;
      return next;
    }, 'setAppChainId');

  return {
    // Accounts
    setRecipientAccount,
    setAgentAccount,

    // Amounts (wrappers + generic)
    setSellAmount,
    setBuyAmount,
    setAmount,

    // Balances (wrappers + generic)
    setSellBalance,
    setBuyBalance,
    setBalance,

    // Contracts & trade params
    setSellTokenContract,
    setBuyTokenContract,
    setTradeDirection,
    setSlippageBps,
    setAppChainId,
  };
}
