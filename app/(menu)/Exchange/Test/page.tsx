'use client'

import React, { useEffect, useState } from 'react'
import { Address, ChainFees, ChainSerializers, HttpTransport } from 'viem'
import { Config, useAccount, UseAccountReturnType, useDisconnect } from 'wagmi'
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
import { BURN_ADDRESS } from '@/lib/network/utils'
import DumpContextButton from '@/components/Buttons/DumpContextButton'
import { stringifyBigInt } from '../../../../../node_modules-dev/spcoin-back-end/spcoin-common/spcoin-lib'

import { exchangeContext } from '@/lib/context'
import InputSelect from '@/components/panes/InputSelect';
import { TokenContract } from '@/lib/structure/types'

const INPUT_PLACE_HOLDER = 'Type or paste token to select address';
const USDT_POLYGON_CONTRACT:Address = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
const CHKN_ETHEREUM_CONTRACT:Address = '0xD55210Bb6898C021a19de1F58d27b71f095921Ee'
let ACTIVE_ACCOUNT: UseAccountReturnType<Config<readonly [{ blockExplorers: { readonly default: { readonly name: "Etherscan"; readonly url: "https://etherscan.io"; readonly apiUrl: "https://api.etherscan.io/api" } }; contracts: { readonly ensRegistry: { readonly address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e" }; readonly ensUniversalResolver: { readonly address: "0xce01f8eee7E479C928F8919abD53E553a36CeF67"; readonly blockCreated: 19258213 }; readonly multicall3: { readonly address: "0xca11bde05977b3631167028862be2a173976ca11"; readonly blockCreated: 14353601 } }; id: 1; name: "Ethereum"; nativeCurrency: { readonly name: "Ether"; readonly symbol: "ETH"; readonly decimals: 18 }; rpcUrls: { readonly default: { readonly http: readonly ["https://cloudflare-eth.com"] } }; sourceId?: number | undefined; testnet?: boolean | undefined; custom?: Record<string, unknown> | undefined; formatters?: undefined; serializers?: ChainSerializers<undefined> | undefined; fees?: ChainFees<undefined> | undefined }, { blockExplorers: { readonly default: { readonly name: "PolygonScan"; readonly url: "https://polygonscan.com"; readonly apiUrl: "https://api.polygonscan.com/api" } }; contracts: { readonly multicall3: { readonly address: "0xca11bde05977b3631167028862be2a173976ca11"; readonly blockCreated: 25770160 } }; id: 137; name: "Polygon"; nativeCurrency: { readonly name: "MATIC"; readonly symbol: "MATIC"; readonly decimals: 18 }; rpcUrls: { readonly default: { readonly http: readonly ["https://polygon-rpc.com"] } }; sourceId?: number | undefined; testnet?: boolean | undefined; custom?: Record<string, unknown> | undefined; formatters?: undefined; serializers?: ChainSerializers<undefined> | undefined; fees?: ChainFees<undefined> | undefined }, { blockExplorers: { readonly default: { readonly name: "Etherscan"; readonly url: "https://sepolia.etherscan.io"; readonly apiUrl: "https://api-sepolia.etherscan.io/api" } }; contracts: { readonly multicall3: { readonly address: "0xca11bde05977b3631167028862be2a173976ca11"; readonly blockCreated: 751532 }; readonly ensRegistry: { readonly address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e" }; readonly ensUniversalResolver: { readonly address: "0xc8Af999e38273D658BE1b921b88A9Ddf005769cC"; readonly blockCreated: 5317080 } }; id: 11155111; name: "Sepolia"; nativeCurrency: { readonly name: "Sepolia Ether"; readonly symbol: "ETH"; readonly decimals: 18 }; rpcUrls: { readonly default: { readonly http: readonly ["https://rpc.sepolia.org"] } }; sourceId?: number | undefined; testnet: true; custom?: Record<string, unknown> | undefined; formatters?: undefined; serializers?: ChainSerializers<undefined> | undefined; fees?: ChainFees<undefined> | undefined }], { 1: HttpTransport; 137: HttpTransport; 11155111: HttpTransport }>>;

const TON_ETHEREUM_CONTRACT:Address = '0x582d872A1B094FC48F5DE31D3B73F2D9bE47def1'
const USDT_ETHEREUM_CONTRACT:Address = BURN_ADDRESS //'0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'

function App() {
  ACTIVE_ACCOUNT = useAccount()
  const [ ACTIVE_ACCOUNT_ADDRESS, setActiveAccountAddress ] = useState<Address|undefined>(BURN_ADDRESS)
  const [ TOKEN_CONTRACT_ADDRESS, setDefaultTokenContractAddress ] = useState<Address>(BURN_ADDRESS)
  const [ EXCHANGE_CONTEXT, setExchangeContext ] = useState<String>("")
  const [ DISPLAY_CONTEXT_BUTTON, setContextButton ] = useState<boolean>(false)
  const [ textInputField, setTokenInput ] = useState<Address|undefined>(TON_ETHEREUM_CONTRACT);

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

  const setTokenContractCallBack = (tokenContract:TokenContract|undefined) => {
    // alert(`Test.setTokenContractCallBack = ${stringifyBigInt(tokenContract)}`)
    setTokenInput(tokenContract?.address);
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

      <InputSelect  placeHolder={INPUT_PLACE_HOLDER}
                    passedInputField={textInputField}
                    setTokenContractCallBack={setTokenContractCallBack}/>

      <ReadWagmiERC20Fields TOKEN_CONTRACT_ADDRESS={textInputField} />
      <ReadWagmiERC20RecordFields TOKEN_CONTRACT_ADDRESS={textInputField} />
      <ReadWagmiERC20Records TOKEN_CONTRACT_ADDRESS={textInputField} />
      <ReadWagmiERC20ContractFields TOKEN_CONTRACT_ADDRESS={textInputField} />
      <ReadWagmiERC20BalanceOf ACTIVE_ACCOUNT_ADDRESS={ACTIVE_ACCOUNT_ADDRESS} TOKEN_CONTRACT_ADDRESS={textInputField} />
      <ReadWagmiERC20ContractName TOKEN_CONTRACT_ADDRESS={textInputField} />
      <ReadWagmiERC20ContractSymbol TOKEN_CONTRACT_ADDRESS={textInputField} />
      <ReadWagmiERC20ContractDecimals TOKEN_CONTRACT_ADDRESS={textInputField} />
      <ReadWagmiERC20ContractTotalSupply TOKEN_CONTRACT_ADDRESS={textInputField} />
    </>
  )
}

export default App
