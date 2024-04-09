import { useEffect, useState } from "react";
import PriceView from "./Price";
import QuoteView from "./Quote";
import type { PriceResponse } from "@/app/api/types";
import { useAccount } from "wagmi";
import { EXCHANGE_STATE } from "@/app/lib/structure/types";
import { exchangeContext } from "@/app/lib/context";

let setExchangeState: (value:EXCHANGE_STATE) => void;
let setFinalize:any;

export default function Home() {
  
  const [price, setPrice] = useState<PriceResponse | undefined>();
  const [quote, setQuote] = useState();
  const [finalize, setFinal] = useState<EXCHANGE_STATE>(EXCHANGE_STATE.PRICE);
  const { address } = useAccount();
  setFinalize = setFinal

  const setState = (exchangeState:EXCHANGE_STATE) => {
    // alert(`setState = (${exchangeState})`)

    setFinal(exchangeState)
    exchangeContext.data.state = exchangeState;
  }
  // alert(`EXCHANGE HERE 1\n FINALIZE = ${finalize} PRICE = ${price} ADDRESS = ${address}` )

  setExchangeState = setState;
  return (
    <main className={`flex min-h-screen flex-col items-center justify-between p-24`} >
      RRRRRRRRRRRRRRRRRRRRRRRR
      {finalize && price && address ? 
      (
      <>
        QQQQQQQQQQQQQQQQQQQQQQQQQQQQ
        <QuoteView
          connectedWalletAddr={address}
          price={price}
          quote={quote}
          setQuote={setQuote}
          />
      </>
        ) : (
          <>
          PPPPPPPPPPPPPPPPPPPPPPPPPPPP
          <PriceView
          connectedWalletAddr={address}
          price={price}
          setPrice={setPrice}
        />
      </>
      )}
    </main>
  );
}

export {
  setExchangeState,
  EXCHANGE_STATE
}