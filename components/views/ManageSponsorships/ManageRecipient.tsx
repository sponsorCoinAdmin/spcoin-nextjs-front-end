// File: @/components/views/ManageSponsorships/ManageRecipient.tsx
'use client';

import React, { useCallback, useContext, useMemo, useState } from 'react';
import Image from 'next/image';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import {
  useRegisterDetailCloser,
  useRegisterHeaderLeft,
  useRegisterHeaderTitle,
} from '@/lib/context/exchangeContext/hooks/useHeaderController';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import ManageWallet from './ManageWallet';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';
import ToDo from '@/lib/utils/components/ToDo';
import { defaultMissingImage } from '@/lib/context/helpers/assetHelpers';
type Props = { onClose?: () => void };

export default function ManageRecipient({ onClose }: Props) {
  const { closePanel, openPanel } = usePanelTree();
  const ctx = useContext(ExchangeContextState);

  const recipientWallet = ctx?.exchangeContext?.accounts?.recipientAccount;
  const logoURL = recipientWallet?.logoURL;
  const resolvedLogo = useMemo(() => logoURL || defaultMissingImage, [logoURL]);

  // Title + left header avatar for the RECIPIENT detail panel
  useRegisterHeaderTitle(
    SP_COIN_DISPLAY.MANAGE_RECIPIENT_PANEL,
    `Recipient ${recipientWallet?.name ?? 'N/A'}`
  );

  useRegisterHeaderLeft(
    SP_COIN_DISPLAY.MANAGE_RECIPIENT_PANEL,
    useMemo(
      () =>
        () => (
          <div className="relative h-10 w-10 shrink-0 m-0 -ml-2.5">
            <Image src={resolvedLogo} alt="Recipient Logo" fill className="object-contain" priority />
          </div>
        ),
      [resolvedLogo]
    )
  );

  const [showToDo, setShowToDo] = useState<boolean>(true);

  const handleClose = useCallback(() => {
    // Go back to the list panel when the header X is clicked
    openPanel(SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL, 'ManageRecipient:handleClose()');
    closePanel(SP_COIN_DISPLAY.MANAGE_RECIPIENT_PANEL, 'ManageRecipient:handleClose()');
    onClose?.();
  }, [openPanel, closePanel, onClose]);

  useRegisterDetailCloser(SP_COIN_DISPLAY.MANAGE_RECIPIENT_PANEL, handleClose);

  return (
    <>
      <ManageWallet wallet={recipientWallet} />
      {!showToDo && (
        <ToDo
          show
          message="ToDo"
          opacity={0.5}
          color="#ff1a1a"
          zIndex={2000}
          onDismiss={() => setShowToDo(false)}
        />
      )}
    </>
  );
}
