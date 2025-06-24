// File: lib/network/createNetworkObject.ts

'use client';

import {
  getBlockChainName,
  getBlockChainSymbol,
  getBlockChainLogoURL,
  getBlockExplorerURL,
} from '@/lib/network/utils';
import { NetworkElement } from '@/lib/structure/types';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_CREATE_NETWORK_OBJECT === 'true';
const debugLog = createDebugLogger('createNetworkObject', DEBUG_ENABLED, LOG_TIME);

/**
 * Creates a full NetworkElement object from a chainId.
 * @param chainId - The numeric chain ID
 * @returns NetworkElement
 */
export function createNetworkObject(chainId: number): NetworkElement {
  const name = getBlockChainName(chainId) || '';
  const logoURL = getBlockChainLogoURL(chainId) || '';
  const url = getBlockExplorerURL(chainId) || '';
  const symbol = getBlockChainSymbol(chainId) || '';
  const connected = true;

  const network: NetworkElement = {
    chainId,
    symbol,
    name,
    logoURL,
    url,
    connected,
  };

  debugLog.log(`🌐 createNetworkObject(${chainId}) →`, network);
  return network;
}
