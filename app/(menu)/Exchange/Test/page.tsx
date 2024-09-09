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
import { BURN_ADDRESS } from '@/lib/network/utils'
import DumpContextButton from '@/components/Buttons/DumpContextButton'
import { stringifyBigInt } from '@/lib/spCoin/utils'
import { exchangeContext } from '@/lib/context'

// let ACTIVE_ACCOUNT_ADDRESS:Address|undefined;
const USDT_POLYGON_CONTRACT:Address  = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
const CHKN_ETHEREUM_CONTRACT:Address = '0xD55210Bb6898C021a19de1F58d27b71f095921Ee'
const TON_ETHEREUM_CONTRACT:Address = '0x582d872A1B094FC48F5DE31D3B73F2D9bE47def1'
const USDT_ETHEREUM_CONTRACT:Address = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
let ACTIVE_ACCOUNT: UseAccountReturnType<Config>;

function App() {
  ACTIVE_ACCOUNT = useAccount()
  const [ ACTIVE_ACCOUNT_ADDRESS, setActiveAccountAddress ] = useState<Address>(BURN_ADDRESS)
  const [ TOKEN_CONTRACT_ADDRESS, setDefaultTokenContractAddress ] = useState<Address>(BURN_ADDRESS)
  const [ EXCHANGE_CONTEXT, setExchangeContext ] = useState<String>("")
  const [ DISPLAY_CONTEXT_BUTTON, setContextButton ] = useState<boolean>(false)

  useEffect(() => {
    // alert(`DISPLAY_CONTEXT_BUTTON = ${DISPLAY_CONTEXT_BUTTON}`)
    setContextButton(DISPLAY_CONTEXT_BUTTON)
  }, [DISPLAY_CONTEXT_BUTTON]);
  
  useEffect(() => {
    // alert(`ACTIVE_ACCOUNT.chainId = ${ACTIVE_ACCOUNT.chainId}`)
      switch(ACTIVE_ACCOUNT.chainId) {
        case 1: setDefaultTokenContractAddress(USDT_ETHEREUM_CONTRACT); break;
        case 137: setDefaultTokenContractAddress(USDT_POLYGON_CONTRACT); break;
        default: setDefaultTokenContractAddress(BURN_ADDRESS); break;
    }
  }, [ACTIVE_ACCOUNT.chainId]);
  
  useEffect(() => {
    // alert(`SETTING ACTIVE_ACCOUNT_ADDRESS = ${ACTIVE_ACCOUNT.address}`)
    if (ACTIVE_ACCOUNT.address != undefined && ACTIVE_ACCOUNT_ADDRESS !== ACTIVE_ACCOUNT.address)
      setActiveAccountAddress(ACTIVE_ACCOUNT.address)
  }, [ACTIVE_ACCOUNT.address]);

  // let ercContract = getErc20ClientContract(TOKEN_CONTRACT_ADDRESS)

  // console.debug(`XXXX ercContract = ${stringifyBigInt(ercContract)}`)

  const show = () => {
    // alert(`show:CustomConnectButton:useEffect(() => exchangeContext = ${stringifyBigInt(exchangeContext)}`);
    setExchangeContext(stringifyBigInt(exchangeContext));
  }
  const hide = () => {
    // alert(`show:CustomConnectButton:useEffect(() => exchangeContext = ${stringifyBigInt(exchangeContext)}`);
    setExchangeContext("");
  }
  const toggle = () => {
    // alert(`show:CustomConnectButton:useEffect(() => exchangeContext = ${stringifyBigInt(exchangeContext)}`);
    exchangeContext.test.dumpContextButton = !exchangeContext.test.dumpContextButton;
    setContextButton(exchangeContext.test.dumpContextButton)
    // alert(`exchangeContext.test.dumpContextButton = ${exchangeContext.test.dumpContextButton}`)
  }


  return (
    <>
      <ProviderConfigurationStatus />

      <div>
        <button
          onClick={show}
          type="button">
            Dump Context
        </button>
      </div>
      <div>
        <button
          onClick={hide}
          type="button">
          Hide Context
        </button>
      </div>
      <div>
        <button
          onClick={toggle}
          type="button">
          Toggle Dump Button On = {DISPLAY_CONTEXT_BUTTON.toString()}
        </button>
      </div>

      <p>{EXCHANGE_CONTEXT}</p>

      <DumpContextButton />
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
