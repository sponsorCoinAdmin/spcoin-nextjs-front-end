import { useState } from "react";
import PriceView from "./Price";
import QuoteView from "./Quote";
import type { PriceResponse } from "@/app/api/types";
import { useAccount } from "wagmi";

export default function Home() {
  const [finalize, setFinalize] = useState(false);
  const [price, setPrice] = useState<PriceResponse | undefined>();
  const [quote, setQuote] = useState();
  const { address } = useAccount();

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24`}
    >
      {finalize && price ? (
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
          setFinalize={setFinalize}
        />
      )}
    </main>
  );
}
