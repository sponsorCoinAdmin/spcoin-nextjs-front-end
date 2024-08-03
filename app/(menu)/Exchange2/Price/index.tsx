'use client';
import styles from '@/styles/Exchange.module.css';
import { TradeData } from '@/lib/structure/types';
import type { PriceResponse } from "@/app/api/types";
import ReadWagmiEcr20BalanceOf from '@/components/ecr20/ReadWagmiEcr20BalanceOf';

//////////// Price Code
export default function PriceView({activeAccount, price, setPrice}: {
    activeAccount: any;
    price: PriceResponse | undefined;
    setPrice: (price: PriceResponse | undefined) => void;
}) {

// console.debug("########################### PRICE RERENDERED #####################################")

  return (
    <form autoComplete="off">
      <div className={styles.tradeContainer}>
        <ReadWagmiEcr20BalanceOf  ACTIVE_ACCOUNT_ADDRESS={activeAccount.address} TOKEN_CONTRACT_ADDRESS={"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"} />
      </div>
    </form>
  ); 
}