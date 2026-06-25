'use client';

import PanelGate from '@/components/utility/PanelGate';
import { SP_COIN_DISPLAY } from '@/lib/structure';

export default function SponsorPanel() {
  return (
    <PanelGate panel={SP_COIN_DISPLAY.SPONSOR_PANEL} className="min-h-0 flex-1">
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-slate-400">Sponsor panel — coming soon</p>
      </div>
    </PanelGate>
  );
}
