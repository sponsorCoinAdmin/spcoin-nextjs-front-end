'use client';
import styles from '@/styles/Exchange.module.css';
import { useState } from "react";
import { useAccount } from 'wagmi' 
import { TokenContract, TradeData } from '@/lib/structure/types';
import type { PriceResponse } from "@/app/api/types";
import { exchangeContext } from "@/lib/context";
import ReadWagmiEcr20BalanceOf from '@/components/ecr20/ReadWagmiEcr20BalanceOf';
import { BURN_ADDRESS } from '@/lib/network/utils';

//////////// Price Code
export default function PriceView({activeAccount, price, setPrice}: {
    activeAccount: any;
    price: PriceResponse | undefined;
    setPrice: (price: PriceResponse | undefined) => void;
}) {

  try {
// console.debug("########################### PRICE RERENDERED #####################################")

    const tradeData:TradeData = exchangeContext.tradeData;
    const [sellTokenContract, setSellTokenContract] = useState<TokenContract>(exchangeContext.sellTokenContract);
  
    tradeData.connectedWalletAddr = activeAccount.address || BURN_ADDRESS;

   const { chain } = useAccount();


    console.debug(`Initializing Fetcher with "/api/" + ${chain?.name.toLowerCase()} + "/0X/price"`)

    try {
      return (
        <form autoComplete="off">
          <div className={styles.tradeContainer}>
            <ReadWagmiEcr20BalanceOf  ACTIVE_ACCOUNT_ADDRESS={activeAccount.address} TOKEN_CONTRACT_ADDRESS={sellTokenContract.address} />
          </div>
         </form>
      );
    } catch (err:any) {
      console.debug (`Price Components Error:\n ${err.message}`)
    }
  } catch (err:any) {
    console.debug (`Price Methods Error:\n ${err.message}`)
  }
}