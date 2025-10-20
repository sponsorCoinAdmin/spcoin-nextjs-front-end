// File: components/views/ManageSponsorships/ManageSponsor.tsx
'use client';

import React, { useCallback, useContext, useMemo, useState } from 'react';
import Image from 'next/image';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import {
  useRegisterHeaderLeft,
  useRegisterHeaderTitle,
  useRegisterDetailCloser,
} from '@/lib/context/exchangeContext/hooks/useHeaderController';
import { SP_COIN_DISPLAY } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';
import ManageWallet from './ManageWallet';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';
import ToDo from '@/lib/utils/components/ToDo';
import { defaultMissingImage } from '@/lib/network/utils';

type Props = { onClose?: () => void };

export default function ManageSponsor({ onClose }: Props) {
  const { closePanel, openPanel } = usePanelTree();
  const ctx = useContext(ExchangeContextState);

  const sponsorWallet = ctx?.exchangeContext?.accounts?.sponsorAccount;
  const logoURL = sponsorWallet?.logoURL;

  useRegisterHeaderTitle(
    SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL,
    `Sponsor ${sponsorWallet?.name ?? 'N/A'}`
  );

  const resolvedLogo = useMemo(() => logoURL || defaultMissingImage, [logoURL]);

  // Left header logo (square, no crop)
  useRegisterHeaderLeft(
    SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL,
    useMemo(
      () =>
        () => (
          <div className="relative h-10 w-10 shrink-0 m-0 -ml-2.5">
            <Image
              src={resolvedLogo}
              alt="Sponsor Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        ),
      [resolvedLogo]
    )
  );

  const [showToDo, setShowToDo] = useState<boolean>(true);

  const handleClose = useCallback(() => {
    openPanel(SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL);
    closePanel(SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL);
    onClose?.();
  }, [openPanel, closePanel, onClose]);

  useRegisterDetailCloser(SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL, handleClose);

  return (
    <>
      <ManageWallet wallet={sponsorWallet} />
      {showToDo && (
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
