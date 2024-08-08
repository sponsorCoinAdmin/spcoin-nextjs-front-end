'use client'

import { useEffect, useState } from 'react'
import { Address, ChainFees, ChainSerializers, HttpTransport } from 'viem'
import { Config, useAccount, UseAccountReturnType } from 'wagmi'
import ReadWagmiEcr20Fields from '@/components/ecr20/ReadWagmiEcr20Fields'
import ReadWagmiEcr20RecordFields from '@/components/ecr20/ReadWagmiEcr20RecordFields'
import WagmiConnect from '@/components/ecr20/WagmiConnect'
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
const FLOKI_ETHEREUM_CONTRACT:Address = '0xcf0C122c6b73ff809C693DB761e7BaeBe62b6a2E'
const NULL_CONTRACT                  = '0x0000000000000000000000000000000000000000';
let ACTIVE_ACCOUNT: UseAccountReturnType<Config<readonly [{ blockExplorers: { readonly default: { readonly name: "Etherscan"; readonly url: "https://etherscan.io"; readonly apiUrl: "https://api.etherscan.io/api" } }; contracts: { readonly ensRegistry: { readonly address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e" }; readonly ensUniversalResolver: { readonly address: "0xce01f8eee7E479C928F8919abD53E553a36CeF67"; readonly blockCreated: 19258213 }; readonly multicall3: { readonly address: "0xca11bde05977b3631167028862be2a173976ca11"; readonly blockCreated: 14353601 } }; id: 1; name: "Ethereum"; nativeCurrency: { readonly name: "Ether"; readonly symbol: "ETH"; readonly decimals: 18 }; rpcUrls: { readonly default: { readonly http: readonly ["https://cloudflare-eth.com"] } }; sourceId?: number | undefined; testnet?: boolean | undefined; custom?: Record<string, unknown> | undefined; formatters?: undefined; serializers?: ChainSerializers<undefined> | undefined; fees?: ChainFees<undefined> | undefined }, { blockExplorers: { readonly default: { readonly name: "PolygonScan"; readonly url: "https://polygonscan.com"; readonly apiUrl: "https://api.polygonscan.com/api" } }; contracts: { readonly multicall3: { readonly address: "0xca11bde05977b3631167028862be2a173976ca11"; readonly blockCreated: 25770160 } }; id: 137; name: "Polygon"; nativeCurrency: { readonly name: "MATIC"; readonly symbol: "MATIC"; readonly decimals: 18 }; rpcUrls: { readonly default: { readonly http: readonly ["https://polygon-rpc.com"] } }; sourceId?: number | undefined; testnet?: boolean | undefined; custom?: Record<string, unknown> | undefined; formatters?: undefined; serializers?: ChainSerializers<undefined> | undefined; fees?: ChainFees<undefined> | undefined }, { blockExplorers: { readonly default: { readonly name: "Etherscan"; readonly url: "https://sepolia.etherscan.io"; readonly apiUrl: "https://api-sepolia.etherscan.io/api" } }; contracts: { readonly multicall3: { readonly address: "0xca11bde05977b3631167028862be2a173976ca11"; readonly blockCreated: 751532 }; readonly ensRegistry: { readonly address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e" }; readonly ensUniversalResolver: { readonly address: "0xc8Af999e38273D658BE1b921b88A9Ddf005769cC"; readonly blockCreated: 5317080 } }; id: 11155111; name: "Sepolia"; nativeCurrency: { readonly name: "Sepolia Ether"; readonly symbol: "ETH"; readonly decimals: 18 }; rpcUrls: { readonly default: { readonly http: readonly ["https://rpc.sepolia.org"] } }; sourceId?: number | undefined; testnet: true; custom?: Record<string, unknown> | undefined; formatters?: undefined; serializers?: ChainSerializers<undefined> | undefined; fees?: ChainFees<undefined> | undefined }], { 1: HttpTransport; 137: HttpTransport; 11155111: HttpTransport }>>;

function App() {
  console.debug("ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ")
  console.debug("*** page:BEFORE ACTIVE_ACCOUNT = " + stringifyBigInt(ACTIVE_ACCOUNT || "UNDEFINED"))
  ACTIVE_ACCOUNT = useAccount()
  console.debug("*** page:AFTER ACTIVE_ACCOUNT = " + stringifyBigInt(ACTIVE_ACCOUNT || "UNDEFINED"))
  const [ ACTIVE_ACCOUNT_ADDRESS, setActiveAccountAddress ] = useState<Address>(NULL_CONTRACT)
  const [ TOKEN_CONTRACT, setDefaultTokenContract ] = useState<Address>(NULL_CONTRACT)

  useEffect(() => {
    if (ACTIVE_ACCOUNT?.chainId !== undefined ) {
      switch(ACTIVE_ACCOUNT.chainId) {
        case 1: setDefaultTokenContract(FLOKI_ETHEREUM_CONTRACT); break;
        case 137: setDefaultTokenContract(USDT_POLYGON_CONTRACT); break;
        default: setDefaultTokenContract(NULL_CONTRACT); break;
      }
    }
  }, [ACTIVE_ACCOUNT.chainId]);
  
  useEffect(() => {
    // alert(`SETTING ACTIVE_ACCOUNT_ADDRESS = ${ACTIVE_ACCOUNT.address}`)
    if (ACTIVE_ACCOUNT.address != undefined && ACTIVE_ACCOUNT_ADDRESS !== ACTIVE_ACCOUNT.address)
      setActiveAccountAddress(ACTIVE_ACCOUNT.address)
  }, [ACTIVE_ACCOUNT.address]);

  // let ercContract = getErc20ClientContract(TOKEN_CONTRACT)

  // console.debug(`XXXX ercContract = ${stringifyBigInt(ercContract)}`)

  return (
    <>
      <ProviderConfigurationStatus />
      <WagmiConnect />
      <ReadWagmiEcr20Fields TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT} />
      <ReadWagmiEcr20RecordFields TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT} />
      <ReadWagmiEcr20Records TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT} />
      <ReadWagmiEcr20ContractFields  TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT} />
      <ReadWagmiEcr20BalanceOf  ACTIVE_ACCOUNT_ADDRESS={ACTIVE_ACCOUNT_ADDRESS} TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT} />
      <ReadWagmiEcr20ContractName  TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT} />
      <ReadWagmiEcr20ContractSymbol  TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT} />
      <ReadWagmiEcr20ContractDecimals  TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT} />
      <ReadWagmiEcr20ContractTotalSupply  TOKEN_CONTRACT_ADDRESS={TOKEN_CONTRACT} />
    </>
  )
}

export default App
// export { ACTIVE_ACCOUNT }
