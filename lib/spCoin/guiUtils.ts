// File: lib/spCoin/guiUtils.ts
'use client';

import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import type { ExchangeContext, TokenContract } from '@/lib/structure';
import { getWagmiBalanceOfRec } from '@/lib/wagmi/getWagmiBalanceOfRec';
import { isAddress } from 'ethers';
import type { Address } from 'viem';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_HELPER === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_GUI_CONTROLLER === 'true';

const debugLog = createDebugLogger('guiUtils', DEBUG_ENABLED, LOG_TIME);

/**
 * Alert-style dump of full exchange context.
 */
const exchangeContextDump = (exchangeContext: ExchangeContext) => {
  const exchangeData = stringifyBigInt(exchangeContext);
  if (typeof window !== 'undefined') {
    alert(exchangeData);
  }
  debugLog.log?.('[exchangeContextDump]', exchangeData);
};

/**
 * General-purpose object logger with optional alert.
 */
const logAlert = (
  obj: any,
  name = '',
  showAlert = false,
  showConsole = true,
): string => {
  const objStr = name
    ? `${name}: ${stringifyBigInt(obj)}`
    : stringifyBigInt(obj);

  if (showConsole) {
    debugLog.log?.('[logAlert]', objStr);
  }

  if (showAlert && typeof window !== 'undefined') {
    alert(objStr);
  }
  return objStr;
};

/**
 * Fetch and build a TokenContract from the blockchain.
 */
const fetchTokenDetails = async (
  chainId: number,
  tokenAddr: string,
): Promise<TokenContract | undefined> => {
  const tokenIconPath = `assets/blockchains/${tokenAddr}.png`;
  let tokenContract: TokenContract | undefined;

  try {
    if (isAddress(tokenAddr)) {
      const retResponse = await getWagmiBalanceOfRec(tokenAddr);

      tokenContract = {
        chainId,
        address: tokenAddr as Address,
        symbol: retResponse.symbol,
        amount: 0n,
        decimals: retResponse.decimals,
        balance: 0n,
        totalSupply: undefined,
        logoURL: tokenIconPath,
      };

      debugLog.log?.('[fetchTokenDetails] built tokenContract', {
        chainId,
        tokenAddr,
        symbol: retResponse.symbol,
        decimals: retResponse.decimals,
      });
    } else {
      debugLog.warn?.(
        '[fetchTokenDetails] invalid token address (isAddress=false)',
        { tokenAddr },
      );
    }
  } catch (e: any) {
    debugLog.error?.('SELL_ERROR: fetchTokenDetails', {
      message: e?.message ?? String(e),
      tokenAddr,
      chainId,
    });
  }

  return tokenContract;
};

/**
 * High-level wrapper to get token details and store them with a callback.
 */
const getTokenDetails = async (
  chainId: number,
  tokenAddr: string,
  setTokenCallback: (token: TokenContract) => void,
): Promise<TokenContract | undefined> => {
  const tokenContract = await fetchTokenDetails(chainId, tokenAddr);
  if (tokenContract) {
    debugLog.log?.('[getTokenDetails] applying setTokenCallback', {
      chainId,
      tokenAddr,
      symbol: tokenContract.symbol,
    });
    setTokenCallback(tokenContract);
  } else {
    debugLog.warn?.('[getTokenDetails] no tokenContract returned', {
      chainId,
      tokenAddr,
    });
  }
  return tokenContract;
};

/**
 * Show a user-facing alert about the current swap state.
 */
const dumpSwapState = (swapType: any) => {
  if (typeof window !== 'undefined') {
    alert(`Swap Type: ${swapType}`);
  }
  debugLog.log?.('[dumpSwapState]', { swapType });
};

/**
 * Refresh a user's token balance in the UI.
 */
const updateBalance = async (
  activeAccountAddr: string | undefined | null,
  tokenContract: TokenContract,
  setBalance: (balance: string) => void,
) => {
  let success = false;
  let balance: string = 'N/A';
  let errMsg = 'N/A';

  if (activeAccountAddr) {
    try {
      const retResponse = await getWagmiBalanceOfRec(tokenContract.address);
      balance = retResponse.formatted;
      setBalance(balance);
      success = true;

      debugLog.log?.('[updateBalance] balance updated', {
        activeAccountAddr,
        tokenAddress: tokenContract.address,
        balance,
      });
    } catch (error: any) {
      errMsg = 'Error fetching balance';
      debugLog.error?.('[updateBalance] Error fetching balance', {
        activeAccountAddr,
        tokenAddress: tokenContract.address,
        message: error?.message ?? String(error),
      });
    }
  } else {
    errMsg = 'Wallet Connection Required for Balance';
    debugLog.warn?.('[updateBalance] no active account address', {
      tokenAddress: tokenContract.address,
    });
  }

  return { success, errMsg, balance };
};

/**
 * Builds a public-facing asset URL based on the environment config.
 */
const getPublicFileUrl = (fileName: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_SPCOIN_BASE_URL;
  if (!baseUrl) {
    const msg =
      'NEXT_PUBLIC_SPCOIN_BASE_URL is not defined in environment variables.';
    debugLog.error?.('[getPublicFileUrl] missing base URL env var', { fileName });
    throw new Error(msg);
  }
  const fullUrl = `${baseUrl}/${fileName}`;
  debugLog.log?.('[getPublicFileUrl]', { fileName, fullUrl });
  return fullUrl;
};

export {
  exchangeContextDump,
  logAlert,
  fetchTokenDetails,
  getTokenDetails,
  dumpSwapState,
  updateBalance,
  getPublicFileUrl,
};
