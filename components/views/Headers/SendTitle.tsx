// File: components/views/Headers/SendTitle.tsx
'use client';

import { SP_COIN_DISPLAY } from '@/lib/structure';
import PanelGate from '@/components/utility/PanelGate';

export default function SendTitle() {
  return (
    <PanelGate panel={SP_COIN_DISPLAY.SEND_TITLE}>
      <div className="relative shrink-0 select-none py-3 text-center">
        <h2 className="m-0 text-xl font-extrabold leading-tight tracking-wide text-[#5981F3] md:text-2xl">
          Send
        </h2>
      </div>
    </PanelGate>
  );
}
