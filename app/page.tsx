'use client'

import { useEffect, useState } from 'react'
import { Address } from 'viem'
import { useAccount } from 'wagmi'
import ReadWagmiEcr20Fields from '@/components/test/ReadWagmiEcr20Fields'
import ReadWagmiEcr20RecordFields from '@/components/test/ReadWagmiEcr20RecordFields'
import WagmiConnect from '@/components/test/WagmiConnect'
import ProviderConfigurationStatus from '@/components/test/ProviderConfigurationStatus'
import ReadWagmiEcr20Records from '@/components/test/ReadWagmiEcr20Records'
import ReadWagmiEcr20ContractFields from '@/components/test/ReadWagmiEcr20ContractFields'
import ReadWagmiEcr20BalanceOf from '@/components/test/ReadWagmiEcr20BalanceOf'
import ReadWagmiEcr20ContractName from '@/components/test/ReadWagmiEcr20ContractName'
import ReadWagmiEcr20ContractSymbol from '@/components/test/ReadWagmiEcr20ContractSymbol'
import ReadWagmiEcr20ContractDecimals from '@/components/test/ReadWagmiEcr20ContractDecimals'
import ReadWagmiEcr20ContractTotalSupply from '@/components/test/ReadWagmiEcr20ContractTotalSupply'

// let ACTIVE_WALLET_ACCOUNT:Address|undefined;
const USDT_POLYGON_CONTRACT:Address  = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
const CHKN_ETHEREUM_CONTRACT:Address = '0xD55210Bb6898C021a19de1F58d27b71f095921Ee'
const NULL_CONTRACT                  = '0x0000000000000000000000000000000000000000';

function App() {
  const account = useAccount()
  const [ ACTIVE_WALLET_ACCOUNT, setActiveWalletAccount ] = useState<Address>(NULL_CONTRACT)
  const [ TOKEN_CONTRACT, setDefaultTokenContract ] = useState<Address>(NULL_CONTRACT)

  useEffect(() => {
    if (account?.chainId !== undefined ) {
      switch(account.chainId) {
        case 1: setDefaultTokenContract(CHKN_ETHEREUM_CONTRACT); break;
        case 137: setDefaultTokenContract(USDT_POLYGON_CONTRACT); break;
        default: setDefaultTokenContract(NULL_CONTRACT); break;
      }
    }
  }, [account.chainId]);
  
  useEffect(() => {
    // alert(`SETTING ACTIVE_WALLET_ACCOUNT = ${account.address}`)
    if (account.address != undefined && ACTIVE_WALLET_ACCOUNT !== account.address)
      setActiveWalletAccount(account.address)
  }, [account.address]);

  // let ercContract = getErc20ClientContract(TOKEN_CONTRACT)

  // console.debug(`XXXX ercContract = ${JSON.stringify(ercContract, (_, v) => typeof v === 'bigint' ? v.toString() : v,2)}`)

  return (
    <>
      <ProviderConfigurationStatus />
      <WagmiConnect />
      <ReadWagmiEcr20Fields TOKEN_CONTRACT={TOKEN_CONTRACT} />
      <ReadWagmiEcr20RecordFields TOKEN_CONTRACT={TOKEN_CONTRACT} />
      <ReadWagmiEcr20Records TOKEN_CONTRACT={TOKEN_CONTRACT} />
      <ReadWagmiEcr20ContractFields  TOKEN_CONTRACT={TOKEN_CONTRACT} />
      <ReadWagmiEcr20BalanceOf  ACTIVE_WALLET_ACCOUNT={ACTIVE_WALLET_ACCOUNT} TOKEN_CONTRACT={TOKEN_CONTRACT} />
      <ReadWagmiEcr20ContractName  TOKEN_CONTRACT={TOKEN_CONTRACT} />
      <ReadWagmiEcr20ContractSymbol  TOKEN_CONTRACT={TOKEN_CONTRACT} />
      <ReadWagmiEcr20ContractDecimals  TOKEN_CONTRACT={TOKEN_CONTRACT} />
      <ReadWagmiEcr20ContractTotalSupply  TOKEN_CONTRACT={TOKEN_CONTRACT} />
    </>
  )
}

export default App
