// File: components/views/TradingStationPanel/AssetSelectDropDowns/AccountSelectDropDown.tsx
'use client';

import React, { useCallback, useState } from 'react';
import type { spCoinAccount } from '@/lib/structure';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { ChevronDown, Copy, Check } from 'lucide-react';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import AccountAvatar from '@/components/utility/AccountAvatar';
import PanelGate from '@/components/utility/PanelGate';
import { truncateMiddle } from '@/lib/utils/addressUtils';

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
  /** Override the default click behavior (opens ACCOUNT_LIST_SELECT_PANEL/RECIPIENT_LIST). */
  onSelectClick?: (e: React.SyntheticEvent) => void;
}

const AccountSelectDropDown: React.FC<Props> = ({ recipientAccount, onSelectClick }) => {
  const { openPanel } = usePanelTree();
  const [copied, setCopied] = useState(false);
  const address = String(recipientAccount?.address ?? '');

  const showRecipientListSelectPanel = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (onSelectClick) {
        onSelectClick(e);
        return;
      }

      debugLog.log?.('📂 Opening Recipient dialog');
      openPanel(
        SP_COIN_DISPLAY.ACCOUNT_LIST_SELECT_PANEL,
        'AccountSelectDropDown:showRecipientListSelectPanel',
        SP_COIN_DISPLAY.RECIPIENT_LIST,
      );
    },
    [openPanel, onSelectClick],
  );

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!address) return;
      navigator.clipboard.writeText(address).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    },
    [address],
  );

  return (
    <PanelGate panel={SP_COIN_DISPLAY.ACCOUNT_SELECT_DROP_DOWN} lazyLoad={false}>
      <div
        id="RECIPIENT_SELECT_DROP_DOWN"
        className="flex items-center gap-[5px] cursor-pointer"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={showRecipientListSelectPanel}
      >
        {recipientAccount && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg">
            <AccountAvatar
              account={recipientAccount}
              mode={SP_COIN_DISPLAY.RECIPIENT_ACCOUNT}
              className="h-full w-full object-contain"
              title={`Show ${recipientAccount.symbol}: ${recipientAccount.name} Meta Data`}
            />
          </div>
        )}
        <div className="flex h-[25px] items-center gap-1 rounded-full bg-[#243056] px-3 font-bold text-[17px] text-white">
          {recipientAccount ? (
            <span title={address}>
              {truncateMiddle(address, 4, 4)}
            </span>
          ) : (
            <> &nbsp; Select Recipient: </>
          )}
          {address && (
            <button
              type="button"
              onClick={handleCopy}
              onMouseDown={(e) => e.stopPropagation()}
              className="shrink-0 flex items-center justify-center rounded hover:bg-white/10 p-0.5"
              aria-label="Copy address"
              title="Copy address"
            >
              {copied
                ? <Check size={14} className="text-green-400" />
                : <Copy size={14} />
              }
            </button>
          )}
          <span className="inline-flex" title="Select a Recipient to Sponsor">
            <ChevronDown
              size={16}
              aria-label="Select a Recipient to Sponsor"
            />
          </span>
        </div>
      </div>
    </PanelGate>
  );
};

export default AccountSelectDropDown;
