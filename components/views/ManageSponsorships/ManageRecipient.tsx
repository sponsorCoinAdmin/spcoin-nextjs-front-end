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
import { createDebugLogger } from '@/lib/utils/debugLogger';

type Props = { onClose?: () => void };

// 🔧 Debug for this module
const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_MANAGE_RECIPIENT === 'true';

const debugLog = createDebugLogger(
  'ManageRecipient',
  DEBUG_ENABLED,
  LOG_TIME,
);

export default function ManageRecipient({ onClose }: Props) {
  const { closePanel, openPanel } = usePanelTree();
  const ctx = useContext(ExchangeContextState);

  const recipientWallet = ctx?.exchangeContext?.accounts?.recipientAccount;
  const logoURL = recipientWallet?.logoURL;
  const resolvedLogo = useMemo(
    () => logoURL || defaultMissingImage,
    [logoURL],
  );

  // Title + left header avatar for the RECIPIENT detail panel
  useRegisterHeaderTitle(
    SP_COIN_DISPLAY.MANAGE_RECIPIENT_PANEL,
    `Recipient ${recipientWallet?.name ?? 'N/A'}`,
  );

  useRegisterHeaderLeft(
    SP_COIN_DISPLAY.MANAGE_RECIPIENT_PANEL,
    useMemo(
      () =>
        () => (
          <div className="relative h-10 w-10 shrink-0 m-0 -ml-2.5">
            <Image
              src={resolvedLogo}
              alt="Recipient Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        ),
      [resolvedLogo],
    ),
  );

  const [showToDo, setShowToDo] = useState<boolean>(true);

  const handleClose = useCallback(() => {
    debugLog.log?.('handleClose → back to MANAGE_RECIPIENTS_PANEL', {
      fromDetail: true,
    });

    // Go back to the list panel when the header X is clicked
    openPanel(
      SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL,
      'ManageRecipient:handleClose(open list)',
    );
    closePanel(
      SP_COIN_DISPLAY.MANAGE_RECIPIENT_PANEL,
      'ManageRecipient:handleClose(close detail)',
    );

    onClose?.();
  }, [openPanel, closePanel, onClose]);

  // Header will call this when MANAGE_RECIPIENT_PANEL is the active detail view
  useRegisterDetailCloser(
    SP_COIN_DISPLAY.MANAGE_RECIPIENT_PANEL,
    handleClose,
  );

  debugLog.log?.('render', {
    recipientAddress: recipientWallet?.address,
    recipientName: recipientWallet?.name,
  });

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
