// File: components/containers/AssetSelectPanels/RecipientSelectPanel.tsx

'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useExchangeContext, useSpCoinDisplay } from '@/lib/context/hooks';
import { useDisplaySpCoinContainers } from '@/lib/spCoin/guiControl';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';

import RecipientSelectDropDown from '../AssetSelectDropDowns/RecipientSelectDropDown';
import SponsorRateConfig from '../SponsorRateConfig';
import BaseSelectPanel from './BaseSelectPanel';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_RECIPIENT_PANEL === 'true';
const debugLog = createDebugLogger('RecipientSelectPanel', DEBUG_ENABLED, false);

const RecipientSelectPanel: React.FC = () => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const [spCoinDisplay, setSpCoinDisplay] = useSpCoinDisplay();
  const [recipientAccount, setRecipientAccount] = useState(
    exchangeContext.accounts.recipientAccount
  );

  useDisplaySpCoinContainers(spCoinDisplay);

  useEffect(() => {
    if (exchangeContext.accounts.recipientAccount !== recipientAccount) {
      setExchangeContext(prev => {
        const cloned = structuredClone(prev);
        cloned.accounts.recipientAccount = recipientAccount;
        return cloned;
      });
    }
  }, [recipientAccount, exchangeContext, setExchangeContext]);

  const clearRecipientSelect = useCallback(() => {
    setSpCoinDisplay(SP_COIN_DISPLAY.SHOW_RECIPIENT_SCROLL_CONTAINER);
    setRecipientAccount(undefined);
  }, [setSpCoinDisplay]);

  const toggleSponsorRateConfig = useCallback(() => {
    const nextState =
      spCoinDisplay === SP_COIN_DISPLAY.SHOW_RECIPIENT_SCROLL_CONTAINER
        ? SP_COIN_DISPLAY.SHOW_SPONSOR_RATE_CONFIG
        : SP_COIN_DISPLAY.SHOW_RECIPIENT_SELECT_DIALOG;

    setSpCoinDisplay(nextState);
    debugLog.log(`⚙️ Toggled sponsor rate config to → ${nextState}`);
  }, [spCoinDisplay, setSpCoinDisplay]);

  return (
    <BaseSelectPanel
      displayState={spCoinDisplay}
      selectedAccount={recipientAccount}
      onClearSelect={clearRecipientSelect}
      onToggleConfig={toggleSponsorRateConfig}
      DropDownComponent={
        <RecipientSelectDropDown
          recipientAccount={recipientAccount}
          callBackAccount={setRecipientAccount}
        />
      }
      ConfigComponent={<SponsorRateConfig />}
      label="You are sponsoring:"
    />
  );
};

export default RecipientSelectPanel;
