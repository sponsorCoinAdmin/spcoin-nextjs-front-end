// File: components/views/Headers/AgentHeaderContainer.tsx
'use client';

import PanelGate from '@/components/utility/PanelGate';
import { SP_COIN_DISPLAY } from '@/lib/structure';

const AGENT_TITLE =
  process.env.NEXT_PUBLIC_AGENT_PAGE_TITLE ?? 'Sponsor Sick Kids Hospital';
const AGENT_SUBTITLE =
  process.env.NEXT_PUBLIC_AGENT_SUB_TITLE ?? 'Your Sponsor Agent';

export default function AgentHeaderContainer() {
  return (
    <PanelGate panel={SP_COIN_DISPLAY.AGENT_HEADER_CONTAINER}>
      <div className="shrink-0 select-none py-3 text-center">
        <h2 className="m-0 text-xl font-extrabold leading-tight tracking-wide text-[#5981F3] md:text-2xl">
          {AGENT_TITLE}
        </h2>
        <p className="m-0 mt-0.5 text-xs text-white/70">{AGENT_SUBTITLE}</p>
      </div>
    </PanelGate>
  );
}
