// File: app/(menu)/Exchange/index.tsx

import PriceView from "./Price/index";
import { EXCHANGE_STATE } from "@/lib/structure";
import React from 'react';

let setExchangeState: (value: EXCHANGE_STATE) => void;

export function Home() {
  return (
    <main className={`flex min-h-screen flex-col items-center justify-between p-24`}>
      <PriceView />
    </main>
  );
}

const Index = () => {
  return (
    <div>
      <Home /> {/* ✅ Render as JSX, not as a direct function call */}
    </div>
  );
}

export default Index;

export {
  setExchangeState,
  EXCHANGE_STATE
}
