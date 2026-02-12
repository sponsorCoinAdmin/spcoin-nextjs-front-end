// File: @/components/views/TradingStationPanel/lib/AssetSelectDropDowns/RecipientSelectDropDown.tsx
'use client';

import React, { useCallback, useRef, useMemo, useEffect } from 'react';
import type { spCoinAccount } from '@/lib/structure';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { ChevronDown } from 'lucide-react';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useAssetLogoURL, markLogoAsBroken } from '@/lib/hooks/useAssetLogoURL';
import { defaultMissingImage } from '@/lib/context/helpers/assetHelpers';
import { usePanelTransitions } from '@/lib/context/exchangeContext/hooks/usePanelTransitions';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

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
  const { openOverlay } = usePanelTransitions();
  const { openPanel } = usePanelTree();

  const logoFromAddr = useAssetLogoURL(recipientAccount?.address || '', 'wallet');
  const logoSrc = useMemo(
    () => recipientAccount?.logoURL?.trim() || logoFromAddr,
    [recipientAccount?.logoURL, logoFromAddr],
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

      if (recipientAccount.address) markLogoAsBroken(recipientAccount.address);
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
        SP_COIN_DISPLAY.RECIPIENT_LIST,
        'RecipientSelectDropDown:setRecipientListMode',
      );
      openOverlay(SP_COIN_DISPLAY.ACCOUNT_LIST_SELECT_PANEL, {
        methodName: 'RecipientSelectDropDown:showRecipientListSelectPanel',
      });
    },
    [openOverlay, openPanel],
  );

  const openRecipientTokenPanel = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      e.stopPropagation();
      openPanel(
        SP_COIN_DISPLAY.TOKEN_PANEL,
        'RecipientSelectDropDown:openRecipientTokenPanel',
      );
    },
    [openPanel],
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
            onClick={openRecipientTokenPanel}
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
