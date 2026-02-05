// File: @/components/views/RadioOverlayPanels/AccountPanel/index.tsx
'use client';

import React, { useCallback, useContext, useState } from 'react';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import ManageAccount from './ManageAccount';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';
import ToDo from '@/lib/utils/components/ToDo';

type Props = { onClose?: () => void };

export default function AccountPanel(_props: Props) {
  // ✅ CRITICAL: Only render when ACCOUNT_PANEL is visible
  const vAccountPanel = usePanelVisible(SP_COIN_DISPLAY.ACCOUNT_PANEL);
  if (!vAccountPanel) return null;

  const ctx = useContext(ExchangeContextState);

  const sponsorWallet = ctx?.exchangeContext?.accounts?.sponsorAccount;
  const hasSponsor = !!sponsorWallet;

  const [showToDo, setShowToDo] = useState<boolean>(false);

  const doToDo = useCallback(() => {
    setShowToDo(false);
    const connected = ctx?.exchangeContext?.accounts?.activeAccount;
    const name = sponsorWallet?.name ?? 'N/A';
    const addr = sponsorWallet?.address ?? '(no sponsor selected)';
    const msg =
      'ToDo: (Not Yet Implemented)\n' +
      `Manage Sponsor actions for: ${name}\n` +
      `Sponsor address: ${addr}\n` +
      `Connected account: ${connected ? connected.address : '(none connected)'}`;
    // eslint-disable-next-line no-alert
    alert(msg);
  }, [
    ctx?.exchangeContext?.accounts?.activeAccount,
    sponsorWallet?.name,
    sponsorWallet?.address,
  ]);

  return (
    <div id="ACCOUNT_PANEL">
      {hasSponsor ? (
        <ManageAccount wallet={sponsorWallet} />
      ) : (
        <div className="p-4 text-sm text-slate-200">
          <p className="mb-2 font-semibold">No sponsor selected.</p>
          <p className="m-0">
            Open the <strong>Sponsors</strong> list and choose a sponsor to manage.
            Once selected, this panel will show the sponsor&apos;s wallet details.
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
          onDismiss={doToDo}
        />
      )}
    </div>
  );
}
