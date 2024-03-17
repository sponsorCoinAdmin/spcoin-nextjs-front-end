import { useState } from "react";
import PriceView from "./Price";
import QuoteView from "./Quote";
import type { PriceResponse } from "@/app/api/types";
import { useAccount } from "wagmi";
import { EXCHANGE_STATE, ExchangeContext } from "@/app/lib/structure/types";
import { useExchangeContext } from "@/app/lib/context";

export default function Home() {
  const exchangeContext:ExchangeContext  = useExchangeContext()
  
  const [price, setPrice] = useState<PriceResponse | undefined>();
  const [quote, setQuote] = useState();
  const { address } = useAccount();
 
  return (
    <main className={`flex min-h-screen flex-col items-center justify-between p-24`} >
      {exchangeContext?.state === EXCHANGE_STATE.QUOTE && price && address ? 
      (
        <QuoteView
          connectedWalletAddr={address}
          price={price}
          quote={quote}
          setQuote={setQuote}
        />
      ) : (
        <PriceView
          connectedWalletAddr={address}
          price={price}
          setPrice={setPrice}
        />
      )}
    </main>
  );
}
