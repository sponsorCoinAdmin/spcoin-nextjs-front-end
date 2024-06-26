import { useState } from "react";
import PriceView from "./Price";
import QuoteView from "./Quote";
import type { PriceResponse } from "@/app/api/types";
import { useAccount } from "wagmi";
import { EXCHANGE_STATE } from "@/lib/structure/types";
import { exchangeContext } from "@/lib/context";
import React from 'react';

let setExchangeState: (value:EXCHANGE_STATE) => void;
let exchangeState:EXCHANGE_STATE;

export function Home() {
  
  const [price, setPrice] = useState<PriceResponse | undefined>();
  const [quote, setQuote] = useState();
  const [state, setState] = useState<EXCHANGE_STATE>(EXCHANGE_STATE.PRICE);

   // alert(`children = ${JSON.stringify(children,null,2)}`)
   const ACTIVE_ACCOUNT = useAccount()
   console.debug("*** Exchange:ACTIVE_ACCOUNT = " + JSON.stringify(ACTIVE_ACCOUNT || "UNDEFINED", (_, v) => typeof v === 'bigint' ? v.toString() : v, 2))

  const setExState = (exchangeState:EXCHANGE_STATE) => {
    // alert(`setState = (${exchangeState})`)
    setState(exchangeState)
    exchangeContext.data.state = exchangeState;
  }
  // alert(`EXCHANGE HERE 1\n state = ${state} PRICE = ${price} ADDRESS = ${address}` )

  setExchangeState = setExState;
  exchangeState = state;
  // alert("HERE 1")

  return (
    <main className={`flex min-h-screen flex-col items-center justify-between p-24`} >
      <PriceView
        activeAccount={ACTIVE_ACCOUNT}
        price={price}
        setPrice={setPrice}
      />

      {/* {state !== EXCHANGE_STATE.QUOTE && price && address ? 
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
      )} */}
    </main>
  );
}

const index = () => {
  return (
    <div>
      {Home()}
    </div>
  );
}

export default index;

export {
  setExchangeState,
  EXCHANGE_STATE
}