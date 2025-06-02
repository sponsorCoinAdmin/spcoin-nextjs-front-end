'use client'

import { useEffect, useState } from 'react'
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
import { NATIVE_TOKEN_ADDRESS } from '@/lib/network/utils'

const USDT_POLYGON_CONTRACT:Address  = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
const CHKN_ETHEREUM_CONTRACT:Address = '0xD55210Bb6898C021a19de1F58d27b71f095921Ee'
let ACTIVE_ACCOUNT: UseAccountReturnType<Config<readonly [{ blockExplorers: { readonly default: { readonly name: "Etherscan"; readonly url: "https://etherscan.io"; readonly apiUrl: "https://api.etherscan.io/api" } }; contracts: { readonly ensRegistry: { readonly address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e" }; readonly ensUniversalResolver: { readonly address: "0xce01f8eee7E479C928F8919abD53E553a36CeF67"; readonly blockCreated: 19258213 }; readonly multicall3: { readonly address: "0xca11bde05977b3631167028862be2a173976ca11"; readonly blockCreated: 14353601 } }; id: 1; name: "Ethereum"; nativeCurrency: { readonly name: "Ether"; readonly symbol: "ETH"; readonly decimals: 18 }; rpcUrls: { readonly default: { readonly http: readonly ["https://cloudflare-eth.com"] } }; sourceId?: number | undefined; testnet?: boolean | undefined; custom?: Record<string, unknown> | undefined; formatters?: undefined; serializers?: ChainSerializers<undefined> | undefined; fees?: ChainFees<undefined> | undefined }, { blockExplorers: { readonly default: { readonly name: "PolygonScan"; readonly url: "https://polygonscan.com"; readonly apiUrl: "https://api.polygonscan.com/api" } }; contracts: { readonly multicall3: { readonly address: "0xca11bde05977b3631167028862be2a173976ca11"; readonly blockCreated: 25770160 } }; id: 137; name: "Polygon"; nativeCurrency: { readonly name: "MATIC"; readonly symbol: "MATIC"; readonly decimals: 18 }; rpcUrls: { readonly default: { readonly http: readonly ["https://polygon-rpc.com"] } }; sourceId?: number | undefined; testnet?: boolean | undefined; custom?: Record<string, unknown> | undefined; formatters?: undefined; serializers?: ChainSerializers<undefined> | undefined; fees?: ChainFees<undefined> | undefined }, { blockExplorers: { readonly default: { readonly name: "Etherscan"; readonly url: "https://sepolia.etherscan.io"; readonly apiUrl: "https://api-sepolia.etherscan.io/api" } }; contracts: { readonly multicall3: { readonly address: "0xca11bde05977b3631167028862be2a173976ca11"; readonly blockCreated: 751532 }; readonly ensRegistry: { readonly address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e" }; readonly ensUniversalResolver: { readonly address: "0xc8Af999e38273D658BE1b921b88A9Ddf005769cC"; readonly blockCreated: 5317080 } }; id: 11155111; name: "Sepolia"; nativeCurrency: { readonly name: "Sepolia Ether"; readonly symbol: "ETH"; readonly decimals: 18 }; rpcUrls: { readonly default: { readonly http: readonly ["https://rpc.sepolia.org"] } }; sourceId?: number | undefined; testnet: true; custom?: Record<string, unknown> | undefined; formatters?: undefined; serializers?: ChainSerializers<undefined> | undefined; fees?: ChainFees<undefined> | undefined }], { 1: HttpTransport; 137: HttpTransport; 11155111: HttpTransport }>>;

function App() {
  // console.debug("*** page:BEFORE ACTIVE_ACCOUNT = " + stringifyBigInt(ACTIVE_ACCOUNT || "UNDEFINED"))
  ACTIVE_ACCOUNT = useAccount()
  // console.debug("*** page:AFTER ACTIVE_ACCOUNT = " + (ACTIVE_ACCOUNT || "UNDEFINED"))
  const [ ACTIVE_ACCOUNT_ADDRESS, setActiveAccountAddress ] = useState<Address>(NATIVE_TOKEN_ADDRESS)
  const [ TOKEN_CONTRACT_ADDRESS, setDefaultTokenContractAddress ] = useState<Address>(NATIVE_TOKEN_ADDRESS)

  useEffect(() => {
      switch(ACTIVE_ACCOUNT.chainId) {
        case 1: setDefaultTokenContractAddress(CHKN_ETHEREUM_CONTRACT); break;
        case 137: setDefaultTokenContractAddress(USDT_POLYGON_CONTRACT); break;
        default: setDefaultTokenContractAddress(NATIVE_TOKEN_ADDRESS); break;
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
      <ReadWagmiERC20BalanceOf  TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
      <ReadWagmiERC20ContractName  TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
      <ReadWagmiERC20ContractSymbol  TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
      <ReadWagmiERC20ContractDecimals  TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
      <ReadWagmiERC20ContractTotalSupply  TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT_ADDRESS} />
    </>
  )
}

export default App
// export { ACTIVE_ACCOUNT }
