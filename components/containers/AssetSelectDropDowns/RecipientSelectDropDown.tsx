'use client';

import React, { useCallback, useRef } from 'react';
import { WalletAccount, SP_COIN_DISPLAY } from '@/lib/structure';
import { ChevronDown } from 'lucide-react';
import { defaultMissingImage } from '@/lib/network/utils';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useAssetLogoURL, markLogoAsBroken } from '@/lib/hooks/useAssetLogoURL';
import { RecipientSelectScrollPanel } from '../AssetSelectScrollPanels';
import { useDisplayControls } from '@/lib/context/hooks';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_RECIPIENT_SELECT_DROP_DOWN === 'true';
const debugLog = createDebugLogger('RecipientSelectDropDown', DEBUG_ENABLED, LOG_TIME);

interface Props {
  recipientAccount: WalletAccount | undefined;
  callBackAccount: (walletAccount: WalletAccount) => void;
}

const RecipientSelectDropDown: React.FC<Props> = ({ recipientAccount, callBackAccount }) => {
  const hasErroredRef = useRef(false);
  const { updateAssetScrollDisplay } = useDisplayControls();

  const logoSrc = useAssetLogoURL(recipientAccount?.address || '', 'wallet');

  const handleLogoError = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      if (!recipientAccount || hasErroredRef.current) return;

      debugLog.log(
        `[RecipientSelectDropDown] Missing logo for ${recipientAccount.symbol} (${recipientAccount.logoURL})`
      );

      markLogoAsBroken(recipientAccount.address);
      hasErroredRef.current = true;
      event.currentTarget.src = defaultMissingImage;
    },
    [recipientAccount]
  );

  const openDialog = useCallback(() => {
    debugLog.log('📂 Opening Recipient scroll panel');
    updateAssetScrollDisplay(SP_COIN_DISPLAY.SHOW_RECIPIENT_SCROLL_CONTAINER);
  }, [updateAssetScrollDisplay]);

  return (
    <>
      <RecipientSelectScrollPanel />

      <div className="flex items-center cursor-pointer" onClick={openDialog}>
        {recipientAccount ? (
          <>
            <img
              alt={recipientAccount.name}
              className="h-9 w-9 mr-2 rounded-md"
              src={logoSrc}
              onClick={(e) => {
                e.stopPropagation();
                alert(`Recipient Data: ${JSON.stringify(recipientAccount, null, 2)}`);
              }}
              onError={handleLogoError}
            />
            {recipientAccount.symbol}
          </>
        ) : (
          <> &nbsp; Select Recipient: </>
        )}
        <ChevronDown size={16} className="ml-2" />
      </div>
    </>
  );
};

export default RecipientSelectDropDown;
