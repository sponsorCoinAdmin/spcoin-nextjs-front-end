'use client';
import styles from '@/styles/Exchange.module.css';
import { useEffect, useState } from "react";
import { TokenContract, TradeData } from '@/lib/structure/types';
import type { PriceResponse } from "@/app/api/types";
import { exchangeContext } from "@/lib/context";
import ReadWagmiEcr20BalanceOf from '@/components/ecr20/ReadWagmiEcr20BalanceOf';
import { BURN_ADDRESS } from '@/lib/network/utils';

let ACTIVE_ACCOUNT: any;

export default function PriceView({activeAccount, price, setPrice}: {
    activeAccount: any;
    price: PriceResponse | undefined;
    setPrice: (price: PriceResponse | undefined) => void;
}) {

  const tradeData:TradeData = exchangeContext.tradeData;
  const [sellTokenContract, setSellTokenContract] = useState<TokenContract>(exchangeContext.sellTokenContract);
  tradeData.connectedWalletAddr = activeAccount.address || BURN_ADDRESS;

  // useEffect(() => {
  //   switch(ACTIVE_ACCOUNT.chainId) {
  //     case 1: setDefaultTokenContract(CHKN_ETHEREUM_CONTRACT); break;
  //     case 137: setDefaultTokenContract(USDT_POLYGON_CONTRACT); break;
  //     default: setDefaultTokenContract(NULL_CONTRACT); break;
  //   }
  // }, [ACTIVE_ACCOUNT.chainId]);


  return (
    <div className={styles.tradeContainer}>
      <ReadWagmiEcr20BalanceOf  ACTIVE_ACCOUNT_ADDRESS={activeAccount.address} TOKEN_CONTRACT_ADDRESS={sellTokenContract.address} />
    </div>
  ); 
}