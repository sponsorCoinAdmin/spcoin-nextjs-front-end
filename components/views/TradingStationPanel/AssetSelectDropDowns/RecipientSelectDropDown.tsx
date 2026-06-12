// File: components/views/TradingStationPanel/AssetSelectDropDowns/RecipientSelectDropDown.tsx
'use client';

import React, { useCallback, useRef, useMemo, useEffect } from 'react';
import type { spCoinAccount } from '@/lib/structure';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { ChevronDown } from 'lucide-react';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { defaultMissingImage } from '@/lib/context/helpers/assetHelpers';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import useOpenAccountComponent from '@/lib/context/hooks/useOpenAccountComponent';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_RECIPIENT_SELECT_DROP_DOWN === 'true';
const debugLog = createDebugLogger(
  'RecipientSelectDropDown',
  DEBUG_ENABLED,
  LOG_TIME,
);

interface Props {
  recipientAccount?: spCoinAccount;
}

const RecipientSelectDropDown: React.FC<Props> = ({ recipientAccount }) => {
  const hasErroredRef = useRef(false);

  // ✅ New transitions API
  const { openPanel } = usePanelTree();
  const openAccountComponent = useOpenAccountComponent();

  const logoSrc = useMemo(
    () => recipientAccount?.logoURL?.trim() || defaultMissingImage,
    [recipientAccount?.logoURL],
  );

  // Reset the "already errored" guard when recipient changes
  useEffect(() => {
    hasErroredRef.current = false;
  }, [recipientAccount?.address]);

  useEffect(() => {
    debugLog.log?.('📥 dropdown props changed', {
      name: recipientAccount?.name,
      symbol: recipientAccount?.symbol,
      address: recipientAccount?.address,
      logoURL: recipientAccount?.logoURL,
      computedLogoSrc: logoSrc,
    });
  }, [recipientAccount, logoSrc]);

  const handleLogoError = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      if (!recipientAccount || hasErroredRef.current) return;
      if (event.currentTarget.src.includes(defaultMissingImage)) return;

      debugLog.log?.(
        `⚠️ Missing logo for ${recipientAccount.symbol} (${recipientAccount.logoURL ?? 'no explicit logoURL'})`,
      );

      hasErroredRef.current = true;
      event.currentTarget.src = defaultMissingImage;
    },
    [recipientAccount],
  );

  const showRecipientListSelectPanel = useCallback(
    (e: React.SyntheticEvent) => {
      // ✅ prevent bubbling into any global “outside click” closers
      e.preventDefault();
      e.stopPropagation();

      debugLog.log?.('📂 Opening Recipient dialog');
      openPanel(
        SP_COIN_DISPLAY.ACCOUNT_LIST_SELECT_PANEL,
        'RecipientSelectDropDown:showRecipientListSelectPanel',
        SP_COIN_DISPLAY.RECIPIENT_LIST,
      );
    },
    [openPanel],
  );

  const openRecipientAccountPanel = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!recipientAccount) return;
      openAccountComponent({
        account: recipientAccount,
        mode: SP_COIN_DISPLAY.RECIPIENT_ACCOUNT,
        source: 'RecipientSelectDropDown:openRecipientAccountPanel',
      });
    },
    [openAccountComponent, recipientAccount],
  );

  return (
    <div
      id="RECIPIENT_SELECT_DROP_DOWN"
      className="flex items-center cursor-pointer"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={showRecipientListSelectPanel}
    >
      {recipientAccount ? (
        <>
          <img
            alt={recipientAccount.name ?? 'Recipient'}
            title={`${recipientAccount.name ?? 'Recipient'} Meta Data`}
            className="h-9 w-9 mr-2 rounded-md"
            src={logoSrc}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={openRecipientAccountPanel}
            onError={handleLogoError}
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
  );
};

export default RecipientSelectDropDown;
