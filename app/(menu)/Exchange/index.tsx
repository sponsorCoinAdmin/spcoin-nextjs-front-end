// File: app/(menu)/Exchange/index.tsx

import React from 'react';
import PriceView from './Price';

export default function Page() {
  return (
    <main className={`flex min-h-screen flex-col items-center justify-between p-24`}>
      <PriceView />
    </main>
  );
}
