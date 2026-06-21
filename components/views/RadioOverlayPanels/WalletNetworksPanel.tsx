// File: components/views/RadioOverlayPanels/WalletNetworksPanel.tsx
'use client';

import { SP_COIN_DISPLAY } from '@/lib/structure';
import PanelGate from '@/components/utility/PanelGate';
import Networks from '@/lib/spCoinWallet/networks';

export default function WalletNetworksPanel() {
  return (
    <PanelGate panel={SP_COIN_DISPLAY.WALLET_NETWORKS_COMPONENT}>
      <div className="-mx-4">
        <Networks />
      </div>
    </PanelGate>
  );
}
