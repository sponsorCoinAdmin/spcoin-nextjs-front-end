// File: components/views/Headers/AgentHeaderContainer.tsx
'use client';

import { ArrowLeft, Menu } from 'lucide-react';
import PanelGate from '@/components/utility/PanelGate';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { SP_COIN_DISPLAY } from '@/lib/structure';

const AGENT_TITLE =
  process.env.NEXT_PUBLIC_AGENT_PAGE_TITLE ?? 'Sponsor Sick Kids Hospital';
const AGENT_SUBTITLE =
  process.env.NEXT_PUBLIC_AGENT_SUB_TITLE ?? 'Your Sponsor Agent';

interface Props {
  onMenuClick?: () => void;
}

export default function AgentHeaderContainer({ onMenuClick }: Props) {
  const { closePanel } = usePanelTree();

  return (
    <PanelGate panel={SP_COIN_DISPLAY.AGENT_HEADER_CONTAINER}>
      <div className="relative shrink-0 select-none pt-3 pb-[2px] text-center">
        <button
          type="button"
          onClick={() => closePanel('AgentHeaderContainer:back')}
          className="absolute left-0 top-[16px] flex h-9 w-9 items-center justify-center rounded-full bg-[#303b68] hover:bg-[#3c487a]"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-[#91a5ff]" />
        </button>
        <h2 className="m-0 text-xl font-extrabold leading-tight tracking-wide text-[#5981F3] md:text-2xl">
          {AGENT_TITLE}
        </h2>
        <p className="m-0 mt-0.5 text-sm font-semibold text-white/75">{AGENT_SUBTITLE}</p>
        {onMenuClick ? (
          <button
            type="button"
            onClick={onMenuClick}
            className="absolute right-0 top-[16px] flex h-9 w-9 items-center justify-center rounded-full bg-[#303b68] hover:bg-[#3c487a]"
            aria-label="Open wallet menu"
          >
            <Menu className="h-5 w-5 text-[#91a5ff]" />
          </button>
        ) : null}
      </div>
    </PanelGate>
  );
}
