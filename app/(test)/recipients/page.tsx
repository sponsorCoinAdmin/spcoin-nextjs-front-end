import WalletsClient from './WalletsClient'
import { loadAccounts } from '@/lib/spCoin/loadAccounts'
import { WalletAccount } from '@/lib/structure/types'

export default async function WalletsPage() {
  const wallets: WalletAccount[] = await loadAccounts()
  return <WalletsClient wallets={wallets} />
}
