// File: app/(menu)/Exchange/index.tsx
import PriceView from "./Price/index";
import { EXCHANGE_STATE } from "@/lib/structure/types";
import * as React from 'react';

export default function ExchangePage() {
  return (
    <main className={`flex min-h-screen flex-col items-center justify-between p-24`}>
      <PriceView />
    </main>
  );
}
