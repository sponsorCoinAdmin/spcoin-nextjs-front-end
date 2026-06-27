'use client';

import React, { useCallback } from 'react';
import TokenListSelectPanel from '@/components/views/RadioOverlayPanels/ListSelectPanels/TokenListSelectPanel';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import type { TokenContract } from '@/lib/structure';

type Props = {
  onSelectToken: (token: TokenContract) => void;
};

export default function TokenListOverlay({ onSelectToken }: Props) {
  const visible = usePanelVisible(SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL);

  const handleSelectToken = useCallback(
    (token: TokenContract) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('spcoin-token-select-trace', {
          detail: { step: 'TokenListOverlay:onSelectToken→parent-callback', ts: Date.now(), address: String((token as any)?.address ?? '(none)').slice(0, 14) },
        }));
      }
      onSelectToken(token);
    },
    [onSelectToken],
  );

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/60">
      <div className="flex h-[min(650px,calc(100vh-230px))] w-[min(520px,calc(100vw-2rem))] min-h-[300px] flex-col overflow-hidden rounded-[15px] border border-[#2e3654] bg-[#0b0e19] text-white shadow-2xl">
        <TokenListSelectPanel onSelect={handleSelectToken} />
      </div>
    </div>
  );
}
