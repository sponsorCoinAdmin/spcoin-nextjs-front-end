import { useState } from "react";
import PriceView from "./Price";
import QuoteView from "./Quote";
import type { PriceResponse } from "@/app/api/types";
import { useAccount } from "wagmi";
import { ExchangeTokens, EXCHANGE_STATE } from "@/app/lib/structure/types";
import { useExchangeContext } from "@/context";

export default function Home() {
  const exchangeContext:ExchangeTokens = useExchangeContext()
  const [exchangeTokens, setExchangeTokens] = useState<ExchangeTokens>(exchangeContext);
  const [price, setPrice] = useState<PriceResponse | undefined>();
  const [quote, setQuote] = useState();
  const { address } = useAccount();
 
  alert (JSON.stringify(exchangeContext, null, 2))
  // const { hello } = useExchangeContext()
  // alert (hello)
return (
    <main className={`flex min-h-screen flex-col items-center justify-between p-24`} >
      {exchangeTokens?.state === EXCHANGE_STATE.QUOTE && price && address  && exchangeTokens ? 
      (
        <QuoteView
          connectedWalletAddr={address}
          price={price}
          quote={quote}
          setQuote={setQuote}
          exchangeTokens={exchangeTokens}
        />
      ) : (
        <PriceView
          connectedWalletAddr={address}
          price={price}
          setPrice={setPrice}
          exchangeTokens={exchangeTokens}
          setExchangeTokens={setExchangeTokens}
        />
      )}
    </main>
  );
}
