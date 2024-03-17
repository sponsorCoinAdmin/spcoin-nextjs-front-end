import * as chains from '@wagmi/chains'
import type { Chain } from 'wagmi'

const chainValues = Object.values(chains)

const chainMap = new Map<number, Chain>()
for (const chain of chainValues) {
  chainMap.set(chain.id, chain)
}

export function getChainFromId(id: number | null | undefined): Chain
export function getChainFromId(
  id: number | null | undefined,
  options: { fallbackToMainnet: false }
): Chain | undefined
export function getChainFromId(
  id: number | null | undefined,
  { fallbackToMainnet = true }: { fallbackToMainnet?: boolean } = {}
): Chain | undefined {
  const chain = id == undefined ? null : chainMap.get(id)
  if (chain) {
    return chain
  }

  if (fallbackToMainnet) {
    return chains.mainnet
  }
}