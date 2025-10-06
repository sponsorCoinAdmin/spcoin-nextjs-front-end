// File: components/containers/RecipientSelectDropDown.tsx
'use client';

import React, { useCallback, useRef } from 'react';
import { WalletAccount } from '@/lib/structure';
import { ChevronDown } from 'lucide-react';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useAssetLogoURL, markLogoAsBroken } from '@/lib/hooks/useAssetLogoURL';
import { defaultMissingImage } from '@/lib/network/utils';
import { usePanelTransitions } from '@/lib/context/exchangeContext/hooks/usePanelTransitions';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_RECIPIENT_SELECT_DROP_DOWN === 'true';
const debugLog = createDebugLogger('RecipientSelectDropDown', DEBUG_ENABLED, LOG_TIME);

interface Props {
  recipientAccount?: WalletAccount;
}

const RecipientSelectDropDown: React.FC<Props> = ({ recipientAccount }) => {
  const hasErroredRef = useRef(false);
  const { openRecipientList } = usePanelTransitions();

  const logoSrc = useAssetLogoURL(recipientAccount?.address || '', 'wallet');

  const handleLogoError = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      if (!recipientAccount || hasErroredRef.current) return;

      debugLog.log(
        `⚠️ Missing logo for ${recipientAccount.symbol} (${recipientAccount.logoURL})`
      );

      markLogoAsBroken(recipientAccount.address);
      hasErroredRef.current = true;
      event.currentTarget.src = defaultMissingImage;
    },
    [recipientAccount]
  );

  const showRecipientSelectPanel = useCallback(() => {
    debugLog.log('📂 Opening Recipient dialog');
    openRecipientList();
  }, [openRecipientList]);

  return (
    <div className="flex items-center cursor-pointer" onClick={showRecipientSelectPanel}>
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
  );
};

export default RecipientSelectDropDown;
