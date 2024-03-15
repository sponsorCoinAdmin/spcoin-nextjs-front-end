import { useState } from "react";
import PriceView from "./Price";
import QuoteView from "./Quote";
import type { PriceResponse } from "@/app/api/types";
import { useAccount } from "wagmi";
import { EXCHANGE_STATE } from "@/app/lib/structure/types";
import { useExchangeContext, useExchangeContextSetter } from "@/context";

export default function Home() {
  const exchangeContext  = useExchangeContext()
  const exchangeContextSetter = useExchangeContextSetter();
  
  const [price, setPrice] = useState<PriceResponse | undefined>();
  const [quote, setQuote] = useState();
  const { address } = useAccount();
 
  // console.debug(JSON.stringify(exchangeContext, null, 2))
  //   <ExchangeConsumer children={function (value: any): ReactNode {
  //     console.debug(`children={function (value: any)`)
  //     return(
  //       <div>{JSON.stringify(value,null,2)}</div>
  //     )
  //   } }>
  //   </ExchangeConsumer>
  // )
  
  return (
    <main className={`flex min-h-screen flex-col items-center justify-between p-24`} >
      {exchangeContext?.state === EXCHANGE_STATE.QUOTE && price && address ? 
      (
        <QuoteView
          connectedWalletAddr={address}
          price={price}
          quote={quote}
          setQuote={setQuote}
          exchangeTokens={exchangeContext}
        />
      ) : (
        <PriceView
          connectedWalletAddr={address}
          price={price}
          setPrice={setPrice}
          exchangeTokens={exchangeContext}
          setExchangeTokens={exchangeContextSetter}
        />
      )}
    </main>
  );
}
