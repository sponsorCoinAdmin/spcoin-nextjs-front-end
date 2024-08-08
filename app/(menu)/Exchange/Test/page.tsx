'use client'

import { useEffect, useState } from 'react'
import { Address, ChainFees, ChainSerializers, HttpTransport } from 'viem'
import { Config, useAccount, UseAccountReturnType, useDisconnect } from 'wagmi'
import ReadWagmiEcr20Fields from '@/components/ecr20/ReadWagmiEcr20Fields'
import ReadWagmiEcr20RecordFields from '@/components/ecr20/ReadWagmiEcr20RecordFields'
import ProviderConfigurationStatus from '@/components/ecr20/ProviderConfigurationStatus'
import ReadWagmiEcr20Records from '@/components/ecr20/ReadWagmiEcr20Records'
import ReadWagmiEcr20ContractFields from '@/components/ecr20/ReadWagmiEcr20ContractFields'
import ReadWagmiEcr20BalanceOf from '@/components/ecr20/ReadWagmiEcr20BalanceOf'
import ReadWagmiEcr20ContractName from '@/components/ecr20/ReadWagmiEcr20ContractName'
import ReadWagmiEcr20ContractSymbol from '@/components/ecr20/ReadWagmiEcr20ContractSymbol'
import ReadWagmiEcr20ContractDecimals from '@/components/ecr20/ReadWagmiEcr20ContractDecimals'
import ReadWagmiEcr20ContractTotalSupply from '@/components/ecr20/ReadWagmiEcr20ContractTotalSupply'
import { stringifyBigInt } from '@/lib/spCoin/utils'

// let ACTIVE_ACCOUNT_ADDRESS:Address|undefined;
const USDT_POLYGON_CONTRACT:Address  = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
const CHKN_ETHEREUM_CONTRACT:Address = '0xD55210Bb6898C021a19de1F58d27b71f095921Ee'
const NULL_CONTRACT                  = '0x0000000000000000000000000000000000000000';
let ACTIVE_ACCOUNT: UseAccountReturnType<Config>;

function App() {
  ACTIVE_ACCOUNT = useAccount()
  const [ ACTIVE_ACCOUNT_ADDRESS, setActiveAccountAddress ] = useState<Address>(NULL_CONTRACT)
  const [ TOKEN_CONTRACT_ADDRESS, setDefaultTokenContractAddress ] = useState<Address>(NULL_CONTRACT)

  useEffect(() => {
      switch(ACTIVE_ACCOUNT.chainId) {
        case 1: setDefaultTokenContractAddress(CHKN_ETHEREUM_CONTRACT); break;
        case 137: setDefaultTokenContractAddress(USDT_POLYGON_CONTRACT); break;
        default: setDefaultTokenContractAddress(NULL_CONTRACT); break;
    }
  }, [ACTIVE_ACCOUNT.chainId]);
  
  useEffect(() => {
    // alert(`SETTING ACTIVE_ACCOUNT_ADDRESS = ${ACTIVE_ACCOUNT.address}`)
    if (ACTIVE_ACCOUNT.address != undefined && ACTIVE_ACCOUNT_ADDRESS !== ACTIVE_ACCOUNT.address)
      setActiveAccountAddress(ACTIVE_ACCOUNT.address)
  }, [ACTIVE_ACCOUNT.address]);

  // let ercContract = getErc20ClientContract(TOKEN_CONTRACT_ADDRESS)

  // console.debug(`XXXX ercContract = ${stringifyBigInt(ercContract)}`)

  return (
    <>
      <ProviderConfigurationStatus />
      {/* <WagmiConnect /> */}
      <ReadWagmiEcr20Fields TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
      <ReadWagmiEcr20RecordFields TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
      <ReadWagmiEcr20Records TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
      <ReadWagmiEcr20ContractFields  TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
      <ReadWagmiEcr20BalanceOf  ACTIVE_ACCOUNT_ADDRESS={ACTIVE_ACCOUNT_ADDRESS} TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
      <ReadWagmiEcr20ContractName  TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
      <ReadWagmiEcr20ContractSymbol  TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
      <ReadWagmiEcr20ContractDecimals  TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
      <ReadWagmiEcr20ContractTotalSupply  TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
    </>
  )
}

export default App
// export { ACTIVE_ACCOUNT }
