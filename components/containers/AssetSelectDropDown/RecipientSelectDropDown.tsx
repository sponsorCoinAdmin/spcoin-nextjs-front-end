'use client';

import { useCallback, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { defaultMissingImage } from '@/lib/network/utils';
import { useAssetLogoURL, markLogoAsBroken } from '@/lib/hooks/useAssetLogoURL';
import { RecipientSelectScrollPanel } from '../AssetSelectScroll';
import {
  InputState,
  WalletAccount,
  getInputStateString,
} from '@/lib/structure';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanel/SharedPanelContext';
import styles from '@/styles/Exchange.module.css';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_RECIPIENT_SELECT_DROP_DOWN === 'true';
const debugLog = createDebugLogger('RecipientSelectDropDown', DEBUG_ENABLED, LOG_TIME);

interface Props {
  recipientAccount: WalletAccount | undefined;
  callBackAccount: (walletAccount: WalletAccount) => void;
}

function RecipientSelectDropDown({ recipientAccount, callBackAccount }: Props) {
  const {
    inputState,
    setInputState,
    feedType,
    activePanelFeed,
    setActivePanelFeed,
  } = useSharedPanelContext();

  const logoSrc = useAssetLogoURL(recipientAccount?.address || '', 'wallet');
  const hasErroredRef = useRef(false);

  const openDialog = useCallback(() => {
    debugLog.log('📂 Opening Recipient dialog');
    setInputState(InputState.VALID_INPUT);
    setActivePanelFeed(feedType); // FEED_TYPE.RECIPIENT_ACCOUNTS
  }, [setInputState, setActivePanelFeed, feedType]);

  const handleLogoError = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      if (!recipientAccount || hasErroredRef.current) return;
      debugLog.log(`🛑 Missing logo for ${recipientAccount.symbol} (${recipientAccount.logoURL})`);
      markLogoAsBroken(recipientAccount.address);
      hasErroredRef.current = true;
      event.currentTarget.src = defaultMissingImage;
    },
    [recipientAccount]
  );

  const processSelect = useCallback(
    (wallet: WalletAccount, state: InputState) => {
      const stateLabel = getInputStateString(state);
      debugLog.log(`🎯 onSelect fired: state=${state} → ${stateLabel}`, { wallet, state });

      if (state === InputState.CLOSE_SELECT_INPUT) {
        debugLog.log('✅ Recipient selected and dialog closed');
        callBackAccount(wallet);
        hasErroredRef.current = false;
        setActivePanelFeed(null);
      }
    },
    [callBackAccount, setActivePanelFeed]
  );

  const isPanelVisible = activePanelFeed === feedType;

  useEffect(() => {
    debugLog.log(`🎯 inputState changed → ${getInputStateString(inputState)}`);
  }, [inputState]);

  return (
    <>
      {isPanelVisible && (
        <RecipientSelectScrollPanel />
      )}

      <div className={styles.assetSelect} onClick={openDialog}>
        {recipientAccount ? (
          <>
            <img
              className="h-9 w-9 mr-2 rounded-md cursor-pointer"
              alt={`${recipientAccount.name} logo`}
              src={logoSrc}
              onClick={(e) => {
                e.stopPropagation();
                alert(stringifyBigInt(recipientAccount));
              }}
              onError={handleLogoError}
            />
            {recipientAccount.symbol}
          </>
        ) : (
          <>Select Recipient:</>
        )}
        <ChevronDown size={18} className="ml-2 cursor-pointer" />
      </div>
    </>
  );
}

export default RecipientSelectDropDown;
