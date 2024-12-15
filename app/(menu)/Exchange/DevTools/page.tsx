'use client'

import { useEffect, useState } from 'react'
import { Address } from 'viem'
import { Config, useAccount, UseAccountReturnType } from 'wagmi'
import ReadWagmiERC20Fields from '@/components/ERC20/ReadWagmiERC20Fields'
import ReadWagmiERC20RecordFields from '@/components/ERC20/ReadWagmiERC20RecordFields'
import ProviderConfigurationStatus from '@/components/ERC20/ProviderConfigurationStatus'
import ReadWagmiERC20Records from '@/components/ERC20/ReadWagmiERC20Records'
import ReadWagmiERC20ContractFields from '@/components/ERC20/ReadWagmiERC20ContractFields'
import ReadWagmiERC20BalanceOf from '@/components/ERC20/ReadWagmiERC20BalanceOf'
import ReadWagmiERC20ContractName from '@/components/ERC20/ReadWagmiERC20ContractName'
import ReadWagmiERC20ContractSymbol from '@/components/ERC20/ReadWagmiERC20ContractSymbol'
import ReadWagmiERC20ContractDecimals from '@/components/ERC20/ReadWagmiERC20ContractDecimals'
import ReadWagmiERC20ContractTotalSupply from '@/components/ERC20/ReadWagmiERC20ContractTotalSupply'
import { stringifyBigInt } from '@/lib/spCoin/utils'

// let ACTIVE_ACCOUNT_ADDRESS:Address|undefined;
const USDT_TON_CONTRACT:Address  = '0x582d872A1B094FC48F5DE31D3B73F2D9bE47def1'
const USDT_POLYGON_CONTRACT:Address  = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
const CHKN_ETHEREUM_CONTRACT:Address = USDT_TON_CONTRACT
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

  // console.debug(`XXXX ercContract = ${stringifyBigInt(ercContract)}`)

  return (
    <>
      <ProviderConfigurationStatus />
      <ReadWagmiERC20Fields TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
      <ReadWagmiERC20RecordFields TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
      <ReadWagmiERC20Records TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
      <ReadWagmiERC20ContractFields  TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
      <ReadWagmiERC20BalanceOf  ACTIVE_ACCOUNT_ADDRESS={ACTIVE_ACCOUNT_ADDRESS} TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
      <ReadWagmiERC20ContractName  TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
      <ReadWagmiERC20ContractSymbol  TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
      <ReadWagmiERC20ContractDecimals  TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
      <ReadWagmiERC20ContractTotalSupply  TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
    </>
  )
}

export default App
// export { ACTIVE_ACCOUNT }
