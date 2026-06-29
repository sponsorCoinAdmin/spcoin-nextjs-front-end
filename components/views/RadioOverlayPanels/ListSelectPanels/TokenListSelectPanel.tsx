'use client';

import { SP_COIN_DISPLAY, type spCoinAccount, type TokenContract } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import PanelListSelectWrapper from '../../AssetSelectPanels/PanelListSelectWrapper';
import { isAddress } from '@/lib/utils/address';

function hasValidAddress(a: any): a is { address: string } {
  return typeof a?.address === 'string' && isAddress(a.address);
}

function emitTrace(step: string, data?: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('spcoin-token-select-trace', {
      detail: { step, ts: Date.now(), ...data },
    }));
  }
}

type Props = {
  onSelect: (asset: TokenContract) => void;
};

export default function TokenListSelectPanel({ onSelect }: Props) {
  const listVisible = usePanelVisible(SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL);
  const buyMode = usePanelVisible(SP_COIN_DISPLAY.BUY_CONTRACT);

  if (!listVisible) return null;

  const handleCommit = (asset: spCoinAccount | TokenContract) => {
    const addr = (asset as any)?.address ?? '(none)';
    const addrType = typeof (asset as any)?.address;
    const valid = hasValidAddress(asset);
    emitTrace('TokenListSelectPanel:handleCommit', {
      address: String(addr).slice(0, 14),
      addrType,
      isAddressValid: valid,
      assetKeys: Object.keys(asset ?? {}),
    });
    if (!valid) {
      emitTrace('TokenListSelectPanel:BLOCKED-hasValidAddress=false', {
        address: String(addr),
        addrType,
        note: 'isAddress() rejected this address — FSM may not have committed a token object',
      });
      return;
    }
    emitTrace('TokenListSelectPanel:calling-onSelect', { address: String(addr).slice(0, 14) });
    onSelect(asset as TokenContract);
  };

  return (
    <div
      id="TOKEN_LIST_SELECT_PANEL"
      className="flex h-full min-h-0 w-full flex-col overflow-hidden"
    >
      {buyMode && <div id="BUY_CONTRACT" className="hidden" aria-hidden="true" />}
      <PanelListSelectWrapper onCommit={handleCommit} />
    </div>
  );
}
