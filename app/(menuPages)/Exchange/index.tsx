import { useEffect, useState } from "react";
import PriceView from "./Price";
import QuoteView from "./Quote";
import type { PriceResponse } from "@/app/api/types";
import { useAccount } from "wagmi";
import { EXCHANGE_STATE } from "@/app/lib/structure/types";
import { exchangeContext } from "@/app/lib/context";

let setFinalize: (value:boolean) => void;

export default function Home() {
  
  const [price, setPrice] = useState<PriceResponse | undefined>();
  const [quote, setQuote] = useState();
  useEffect(() => { alert("changed");},[exchangeContext.state])
  const [finalize, setFinal] = useState<boolean>(false);
  const { address } = useAccount();
  setFinalize = setFinal;
  return (
    <main className={`flex min-h-screen flex-col items-center justify-between p-24`} >
      {finalize && price && address ? 
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

export {
  setFinalize
}