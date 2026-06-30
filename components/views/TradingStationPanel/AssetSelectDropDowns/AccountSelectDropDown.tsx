// File: components/views/TradingStationPanel/AssetSelectDropDowns/AccountSelectDropDown.tsx
'use client';

import React, { useCallback } from 'react';
import type { spCoinAccount } from '@/lib/structure';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { ChevronDown } from 'lucide-react';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import AccountAvatar from '@/components/utility/AccountAvatar';
import PanelGate from '@/components/utility/PanelGate';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_ACCOUNT_SELECT_DROP_DOWN === 'true';
const debugLog = createDebugLogger(
  'AccountSelectDropDown',
  DEBUG_ENABLED,
  LOG_TIME,
);

interface Props {
  recipientAccount?: spCoinAccount;
}

const AccountSelectDropDown: React.FC<Props> = ({ recipientAccount }) => {
  const { openPanel } = usePanelTree();

  const showRecipientListSelectPanel = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      e.stopPropagation();

      debugLog.log?.('📂 Opening Recipient dialog');
      openPanel(
        SP_COIN_DISPLAY.ACCOUNT_LIST_SELECT_PANEL,
        'AccountSelectDropDown:showRecipientListSelectPanel',
        SP_COIN_DISPLAY.RECIPIENT_LIST,
      );
    },
    [openPanel],
  );

  return (
    <PanelGate panel={SP_COIN_DISPLAY.ACCOUNT_SELECT_DROP_DOWN} lazyLoad={false}>
      <div
        id="RECIPIENT_SELECT_DROP_DOWN"
        className="flex items-center cursor-pointer"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={showRecipientListSelectPanel}
      >
        {recipientAccount ? (
          <>
            <AccountAvatar
              account={recipientAccount}
              mode={SP_COIN_DISPLAY.RECIPIENT_ACCOUNT}
              className="h-9 w-9 mr-2 rounded-full object-cover"
            />
            {recipientAccount.symbol}
          </>
        ) : (
          <> &nbsp; Select Recipient: </>
        )}
        <span className="ml-2 inline-flex" title="Select a Recipient to Sponsor">
          <ChevronDown
            size={16}
            aria-label="Select a Recipient to Sponsor"
          />
        </span>
      </div>
    </PanelGate>
  );
};

export default AccountSelectDropDown;
