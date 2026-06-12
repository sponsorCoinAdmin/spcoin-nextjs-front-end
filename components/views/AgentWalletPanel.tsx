'use client';

import MainTradingPanel from '@/components/views/MainTradingPanel';

const SPONSOR_TITLE =
  process.env.NEXT_PUBLIC_AGENT_PAGE_TITLE ?? 'Sponsor Sick Kids Hospital';
const SPONSOR_SUBTITLE =
  process.env.NEXT_PUBLIC_AGENT_SUB_TITLE ?? 'Your Sponsor Agent';

export default function AgentWalletPanel() {
  return (
    <div className="scrollbar-hide h-full min-h-0 overflow-y-auto overscroll-contain px-4 pb-4 pt-5">
      <div className="shrink-0 select-none pb-4 text-center">
        <h1 className="m-0 text-2xl font-extrabold leading-tight tracking-wide text-[#5981F3] md:text-3xl">
          {SPONSOR_TITLE}
        </h1>
        <p className="m-0 mt-1 text-sm text-white/80">{SPONSOR_SUBTITLE}</p>
      </div>

      <div className="w-full overflow-hidden rounded-[15px] border border-[#2e3654] bg-[#0b0e19] text-white">
        <MainTradingPanel embeddedInPopup />
      </div>
    </div>
  );
}
