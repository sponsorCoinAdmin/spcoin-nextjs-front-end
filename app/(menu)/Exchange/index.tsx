import PriceView from "./Price";
import { EXCHANGE_STATE } from "@/lib/structure/types";
import React from 'react';

let setExchangeState: (value:EXCHANGE_STATE) => void;
let exchangeState:EXCHANGE_STATE;

export function Home() {
  return (
    <main className={`flex min-h-screen flex-col items-center justify-between p-24`} >
      <PriceView />
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