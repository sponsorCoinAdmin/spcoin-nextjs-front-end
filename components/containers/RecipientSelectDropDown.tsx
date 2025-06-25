'use client';

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { RecipientDialogWrapper } from '@/components/Dialogs/AssetSelectDialog';
import { WalletAccount, InputState } from '@/lib/structure';
import { ChevronDown } from 'lucide-react';
import { isAddress } from 'viem';
import { useChainId } from 'wagmi';
import { defaultMissingImage } from '@/lib/network/utils';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_RECIPIENT_SELECT_DROP_DOWN === 'true';
const debugLog = createDebugLogger('RecipientSelectDropDown', DEBUG_ENABLED, LOG_TIME);

// Shared broken logo tracker
const seenBrokenLogos = new Set<string>();

function useAssetLogoURL(address: string, type: 'wallet' | 'token', fallbackURL = defaultMissingImage): string {
  const chainId = useChainId();

  return useMemo(() => {
    if (!address || !isAddress(address)) return fallbackURL;
    if (!chainId) return fallbackURL;
    if (seenBrokenLogos.has(address)) return fallbackURL;

    const logoURL =
      type === 'wallet'
        ? `/assets/wallets/${address}/avatar.png`
        : `/assets/blockchains/${chainId}/contracts/${address}/logo.png`;

    debugLog.log(`✅ logoURL (${type}) = ${logoURL}`);
    return logoURL;
  }, [address, type, chainId]);
}

interface Props {
  recipientAccount: WalletAccount | undefined;
  callBackAccount: (walletAccount: WalletAccount) => void;
}

const RecipientSelectDropDown: React.FC<Props> = ({ recipientAccount, callBackAccount }) => {
  const [showDialog, setShowDialog] = useState(false);
  const hasErroredRef = useRef(false);

  const openDialog = useCallback(() => setShowDialog(true), []);

  const handleRecipientSelect = useCallback(
    (wallet: WalletAccount) => {
      debugLog.log('✅ [RecipientSelectDropDown] Received wallet from dialog:', wallet);
      callBackAccount(wallet);
      hasErroredRef.current = false;
    },
    [callBackAccount]
  );

  const logoSrc = useAssetLogoURL(recipientAccount?.address || '', 'wallet');

  const handleLogoError = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      if (!recipientAccount || hasErroredRef.current) return;

      debugLog.log(
        `[RecipientSelectDropDown] Missing logo for ${recipientAccount.symbol} (${recipientAccount.logoURL})`
      );

      seenBrokenLogos.add(recipientAccount.address);
      hasErroredRef.current = true;
      event.currentTarget.src = defaultMissingImage;
    },
    [recipientAccount]
  );

  return (
    <>
      <RecipientDialogWrapper
        showDialog={showDialog}
        setShowDialog={setShowDialog}
        onSelect={(wallet, state) => {
          debugLog.log('🎯 [RecipientDialogWrapper -> DropDown] onSelect triggered', { wallet, state });
          if (state === InputState.CLOSE_INPUT) {
            handleRecipientSelect(wallet);
            setShowDialog(false);
          }
        }}
      />
      {recipientAccount ? (
        <>
          <img
            alt={recipientAccount.name}
            className="h-9 w-9 mr-2 rounded-md cursor-pointer"
            src={logoSrc}
            onClick={() => alert(`Recipient Data: ${JSON.stringify(recipientAccount, null, 2)}`)}
            onError={handleLogoError}
          />
          {recipientAccount.symbol}
        </>
      ) : (
        <> &nbsp; Select Recipient: </>
      )}
      <ChevronDown size={16} onClick={openDialog} style={{ cursor: 'pointer', marginLeft: '0.5rem' }} />
    </>
  );
};

export default RecipientSelectDropDown;
