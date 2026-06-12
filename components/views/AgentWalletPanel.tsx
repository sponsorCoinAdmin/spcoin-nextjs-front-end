'use client';

import MainTradingPanel from '@/components/views/MainTradingPanel';

const SPONSOR_TITLE =
  process.env.NEXT_PUBLIC_AGENT_PAGE_TITLE ?? 'Sponsor Sick Kids Hospital';
const SPONSOR_SUBTITLE =
  process.env.NEXT_PUBLIC_AGENT_SUB_TITLE ?? 'Your Sponsor Agent';

interface AgentWalletPanelProps {
  onBack: () => void;
  onClose: () => void;
}

export default function AgentWalletPanel({
  onBack,
  onClose,
}: AgentWalletPanelProps) {
  return (
    <div
      className="fixed inset-0 z-[10000] overflow-y-auto bg-[#050711] text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Sponsor agent wallet"
    >
      <div className="absolute right-5 top-5 flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#303b73] text-2xl text-[#91a5ff] hover:bg-[#3a4788]"
          aria-label="Return to wallet options"
        >
          &#9776;
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#303b73] text-3xl text-[#91a5ff] hover:bg-[#3a4788]"
          aria-label="Close agent wallet"
        >
          &times;
        </button>
      </div>

      <div className="mx-auto flex min-h-full w-[min(560px,calc(100vw-2rem))] flex-col justify-center gap-4 py-20">
        <div className="shrink-0 select-none text-center">
          <h1 className="m-0 text-2xl font-extrabold leading-tight tracking-wide text-[#5981F3] md:text-3xl">
            {SPONSOR_TITLE}
          </h1>
          <p className="m-0 mt-1 text-sm text-white/80">{SPONSOR_SUBTITLE}</p>
        </div>

        <div className="w-full overflow-hidden rounded-[15px] border border-[#2e3654] bg-[#0b0e19] text-white shadow-2xl">
          <MainTradingPanel embeddedInPopup />
        </div>
      </div>
    </div>
  );
}
