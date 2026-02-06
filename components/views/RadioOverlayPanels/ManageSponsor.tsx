// File: @/components/views/ManageSponsorships/ManageSponsor.tsx
'use client';

import React, { useCallback, useContext, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  useRegisterHeaderLeft,
  useRegisterHeaderTitle,
} from '@/lib/context/exchangeContext/hooks/useHeaderController';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import ManageAccount from './AccountPanel/ManageAccount';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';
import ToDo from '@/lib/utils/components/ToDo';
import { defaultMissingImage } from '@/lib/context/helpers/assetHelpers';

type Props = { onClose?: () => void };

export default function ManageSponsor(_props: Props) {
  const ctx = useContext(ExchangeContextState);

  const sponsorAccount = ctx?.exchangeContext?.accounts?.sponsorAccount;
  const logoURL = sponsorAccount?.logoURL;
  const hasSponsor = !!sponsorAccount;

  // Header title
  useRegisterHeaderTitle(
    SP_COIN_DISPLAY.SPONSOR_ACCOUNT_PANEL,
    hasSponsor ? `Sponsor ${sponsorAccount?.name ?? 'N/A'}` : 'Sponsor (none selected)',
  );

  const resolvedLogo = useMemo(() => logoURL || defaultMissingImage, [logoURL]);

  // Left header logo (square, no crop)
  useRegisterHeaderLeft(
    SP_COIN_DISPLAY.SPONSOR_ACCOUNT_PANEL,
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
      [resolvedLogo],
    ),
  );

  const [showToDo, setShowToDo] = useState<boolean>(false);

  const doToDo = useCallback(() => {
    setShowToDo(false);
    const connected = ctx?.exchangeContext?.accounts?.activeAccount;
    const name = sponsorAccount?.name ?? 'N/A';
    const addr = sponsorAccount?.address ?? '(no sponsor selected)';
    const msg =
      'ToDo: (Not Yet Implemented)\n' +
      `Manage Sponsor actions for: ${name}\n` +
      `Sponsor address: ${addr}\n` +
      `Connected account: ${connected ? connected.address : '(none connected)'}`;
    // eslint-disable-next-line no-alert
    alert(msg);
  }, [
    ctx?.exchangeContext?.accounts?.activeAccount,
    sponsorAccount?.name,
    sponsorAccount?.address,
  ]);

  return (
    <div id="SPONSOR_ACCOUNT_PANEL">
      {hasSponsor ? (
        <ManageAccount account={sponsorAccount} />
      ) : (
        <div className="p-4 text-sm text-slate-200">
          <p className="mb-2 font-semibold">No sponsor selected.</p>
          <p className="m-0">
            Open the <strong>Sponsors</strong> list and choose a sponsor to manage.
            Once selected, this panel will show the sponsor&apos;s account details.
          </p>
        </div>
      )}

      {showToDo && (
        <ToDo
          show
          message="ToDo"
          opacity={0.5}
          color="#ff1a1a"
          zIndex={2000}
          onDismiss={() => doToDo()}
        />
      )}
    </div>
  );
}
