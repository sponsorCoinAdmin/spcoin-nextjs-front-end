// File: lib/hooks/trade/useConfigButtonVisibility.ts
'use client';

import { useEffect, useMemo } from 'react';
import { isSpCoin } from '@/lib/spCoin/coreUtils';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { SP_COIN_DISPLAY as SP_TREE } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';
import type { TokenContract } from '@/lib/structure';

type Params = {
  isSell: boolean;
  isBuy: boolean;
  tokenContract?: TokenContract;
};

/**
 * Controls the button nodes under the SELL/BUY panels and returns whether to render them.
 * - SELL: toggles SPONSORSHIP_SELECT_CONFIG_BUTTON
 * - BUY : toggles RECIPIENT_SELECT_CONFIG_BUTTON
 * - Hides Add button when RECIPIENT_SELECT_PANEL is visible (inline panel is open)
 */
export function useConfigButtonVisibility({ isSell, isBuy, tokenContract }: Params) {
  const { isVisible, openPanel, closePanel } = usePanelTree();

  // Gate the config-button nodes based on whether current token is an spCoin
  useEffect(() => {
    const sp = tokenContract ? isSpCoin(tokenContract) : false;

    if (isSell) {
      sp ? openPanel(SP_TREE.SPONSORSHIP_SELECT_CONFIG_BUTTON)
         : closePanel(SP_TREE.SPONSORSHIP_SELECT_CONFIG_BUTTON);
    }
    if (isBuy) {
      sp ? openPanel(SP_TREE.RECIPIENT_SELECT_CONFIG_BUTTON)
         : closePanel(SP_TREE.RECIPIENT_SELECT_CONFIG_BUTTON);
    }
  }, [isSell, isBuy, tokenContract, openPanel, closePanel]);

  // Compute render flags
  const isRecipientInlineVisible = isVisible(SP_TREE.RECIPIENT_SELECT_PANEL);

  const showManageBtn = useMemo(
    () => isSell && isVisible(SP_TREE.SPONSORSHIP_SELECT_CONFIG_BUTTON),
    [isSell, isVisible]
  );

  const showRecipientBtn = useMemo(
    () => isBuy && isVisible(SP_TREE.RECIPIENT_SELECT_CONFIG_BUTTON) && !isRecipientInlineVisible,
    [isBuy, isVisible, isRecipientInlineVisible]
  );

  return { showManageBtn, showRecipientBtn };
}
