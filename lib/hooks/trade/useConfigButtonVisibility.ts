// File: lib/hooks/trade/useConfigButtonVisibility.ts
'use client';

import { useEffect, useMemo, useRef } from 'react';
import { isSpCoin } from '@/lib/spCoin/coreUtils';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { SP_COIN_DISPLAY as SP_TREE } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';
import type { TokenContract } from '@/lib/structure';

type Params = {
  isSell: boolean;
  isBuy: boolean;
  tokenContract?: TokenContract;
};

export function useConfigButtonVisibility({ isSell, isBuy, tokenContract }: Params) {
  const { isVisible, openPanel, closePanel } = usePanelTree();

  // Use a stable key for deps so the effect doesn't fire on every render.
  const addr = tokenContract?.address?.toLowerCase() ?? '';
  const isInlineOpen = isVisible(SP_TREE.ADD_SPONSORSHIP_PANEL);
  const isButtonOn   = isVisible(SP_TREE.ADD_SPONSORSHIP_BUTTON);
  const isSellBtnOn  = isVisible(SP_TREE.MANAGE_SPONSORSHIPS_BUTTON);

  // Track previous token & sp status to detect meaningful transitions
  const prevAddrRef = useRef(addr);
  const prevSpRef   = useRef<boolean | null>(null);

  useEffect(() => {
    const sp = tokenContract ? isSpCoin(tokenContract) : false;
    const tokenChanged = prevAddrRef.current !== addr;
    const spChanged    = prevSpRef.current !== sp;

    // SELL side button
    if (isSell) {
      if (!sp && isSellBtnOn) closePanel(SP_TREE.MANAGE_SPONSORSHIPS_BUTTON);
      if (sp && (tokenChanged || spChanged) && !isSellBtnOn) {
        openPanel(SP_TREE.MANAGE_SPONSORSHIPS_BUTTON);
      }
    }

    // BUY side button
    if (isBuy) {
      // Always close when inline panel is open or not an spCoin
      if (isInlineOpen || !sp) {
        if (isButtonOn) closePanel(SP_TREE.ADD_SPONSORSHIP_BUTTON);
      } else {
        // Only auto-open on token/sp transitions (respect manual close)
        if ((tokenChanged || spChanged) && !isButtonOn) {
          openPanel(SP_TREE.ADD_SPONSORSHIP_BUTTON);
        }
      }
    }

    prevAddrRef.current = addr;
    prevSpRef.current   = sp;
    // Fire when the things above can *meaningfully* change behavior
  }, [addr, isSell, isBuy, isInlineOpen, isSellBtnOn, isButtonOn, openPanel, closePanel, tokenContract]);

  // Render booleans
  const showManageBtn = useMemo(
    () => isSell && isSellBtnOn,
    [isSell, isSellBtnOn]
  );

  const showRecipientBtn = useMemo(
    () => isBuy && isButtonOn && !isInlineOpen,
    [isBuy, isButtonOn, isInlineOpen]
  );

  return { showManageBtn, showRecipientBtn };
}
