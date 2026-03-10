// File: lib/utils/network/tokenAssetChainMap.ts
import { toMappedChainId } from './chainIdMap';

export function resolveTokenAssetChainId(chainId: number): number {
  return toMappedChainId(chainId);
}
