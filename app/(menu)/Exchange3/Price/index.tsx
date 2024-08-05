'use client';

import { useEffect, useState } from 'react'
import { Address, ChainFees, ChainSerializers, HttpTransport } from 'viem'
import { Config, UseAccountReturnType } from 'wagmi'
import ReadWagmiEcr20BalanceOf from '@/components/ecr20/ReadWagmiEcr20BalanceOf'

import styles from '@/styles/Exchange.module.css';
import { TokenContract, TradeData } from '@/lib/structure/types';
import type { PriceResponse } from "@/app/api/types";
import { exchangeContext } from "@/lib/context";
import { BURN_ADDRESS } from '@/lib/network/utils';

const USDT_POLYGON_CONTRACT:Address  = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
const CHKN_ETHEREUM_CONTRACT:Address = '0xD55210Bb6898C021a19de1F58d27b71f095921Ee'
const NULL_CONTRACT                  = '0x0000000000000000000000000000000000000000';
let ACTIVE_ACCOUNT: UseAccountReturnType<Config<readonly [{ blockExplorers: { readonly default: { readonly name: "Etherscan"; readonly url: "https://etherscan.io"; readonly apiUrl: "https://api.etherscan.io/api" } }; contracts: { readonly ensRegistry: { readonly address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e" }; readonly ensUniversalResolver: { readonly address: "0xce01f8eee7E479C928F8919abD53E553a36CeF67"; readonly blockCreated: 19258213 }; readonly multicall3: { readonly address: "0xca11bde05977b3631167028862be2a173976ca11"; readonly blockCreated: 14353601 } }; id: 1; name: "Ethereum"; nativeCurrency: { readonly name: "Ether"; readonly symbol: "ETH"; readonly decimals: 18 }; rpcUrls: { readonly default: { readonly http: readonly ["https://cloudflare-eth.com"] } }; sourceId?: number | undefined; testnet?: boolean | undefined; custom?: Record<string, unknown> | undefined; formatters?: undefined; serializers?: ChainSerializers<undefined> | undefined; fees?: ChainFees<undefined> | undefined }, { blockExplorers: { readonly default: { readonly name: "PolygonScan"; readonly url: "https://polygonscan.com"; readonly apiUrl: "https://api.polygonscan.com/api" } }; contracts: { readonly multicall3: { readonly address: "0xca11bde05977b3631167028862be2a173976ca11"; readonly blockCreated: 25770160 } }; id: 137; name: "Polygon"; nativeCurrency: { readonly name: "MATIC"; readonly symbol: "MATIC"; readonly decimals: 18 }; rpcUrls: { readonly default: { readonly http: readonly ["https://polygon-rpc.com"] } }; sourceId?: number | undefined; testnet?: boolean | undefined; custom?: Record<string, unknown> | undefined; formatters?: undefined; serializers?: ChainSerializers<undefined> | undefined; fees?: ChainFees<undefined> | undefined }, { blockExplorers: { readonly default: { readonly name: "Etherscan"; readonly url: "https://sepolia.etherscan.io"; readonly apiUrl: "https://api-sepolia.etherscan.io/api" } }; contracts: { readonly multicall3: { readonly address: "0xca11bde05977b3631167028862be2a173976ca11"; readonly blockCreated: 751532 }; readonly ensRegistry: { readonly address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e" }; readonly ensUniversalResolver: { readonly address: "0xc8Af999e38273D658BE1b921b88A9Ddf005769cC"; readonly blockCreated: 5317080 } }; id: 11155111; name: "Sepolia"; nativeCurrency: { readonly name: "Sepolia Ether"; readonly symbol: "ETH"; readonly decimals: 18 }; rpcUrls: { readonly default: { readonly http: readonly ["https://rpc.sepolia.org"] } }; sourceId?: number | undefined; testnet: true; custom?: Record<string, unknown> | undefined; formatters?: undefined; serializers?: ChainSerializers<undefined> | undefined; fees?: ChainFees<undefined> | undefined }], { 1: HttpTransport; 137: HttpTransport; 11155111: HttpTransport }>>;

//////////// Price Code
export default function PriceView({activeAccount}: {
    activeAccount: any;
    price: PriceResponse | undefined;
    setPrice: (price: PriceResponse | undefined) => void;
}) {
  ACTIVE_ACCOUNT = activeAccount;
  const [ ACTIVE_ACCOUNT_ADDRESS, setActiveAccountAddress ] = useState<Address>(NULL_CONTRACT)
  const [sellTokenContract, setSellTokenContract] = useState<TokenContract>(exchangeContext.sellTokenContract);
  const [ TOKEN_CONTRACT, setDefaultTokenContract ] = useState<Address>(NULL_CONTRACT)
  const tradeData:TradeData = exchangeContext.tradeData;

  useEffect(() => {
    // alert(`ACTIVE_ACCOUNT.chainId = ${ACTIVE_ACCOUNT.chainId}`)
      switch(ACTIVE_ACCOUNT.chainId) {
        case 1: setDefaultTokenContract(CHKN_ETHEREUM_CONTRACT); break;
        case 137: setDefaultTokenContract(USDT_POLYGON_CONTRACT); break;
        default: setDefaultTokenContract(NULL_CONTRACT); break;
    }
  }, [ACTIVE_ACCOUNT.chainId]);

  tradeData.connectedWalletAddr = activeAccount.address || BURN_ADDRESS;
  const connectedWalletAddr = tradeData.connectedWalletAddr;

    return (
      <>
        <div>connectedWalletAddr       = {connectedWalletAddr}</div>
        <div>sellTokenContract.address = {sellTokenContract.address}</div>
        <div>ACTIVE_ACCOUNT_ADDRESS    = {ACTIVE_ACCOUNT_ADDRESS}</div>
        <div>TOKEN_CONTRACT            = {TOKEN_CONTRACT}`</div>
        <div className={styles.tradeContainer}>
          <ReadWagmiEcr20BalanceOf  ACTIVE_ACCOUNT_ADDRESS={connectedWalletAddr} TOKEN_CONTRACT_ADDRESS={sellTokenContract.address} />
          {/* <ReadWagmiEcr20BalanceOf  ACTIVE_ACCOUNT_ADDRESS={connectedWalletAddr} TOKEN_CONTRACT={sellTokenContract.address} /> */}
        </div>
      </>
    );
}