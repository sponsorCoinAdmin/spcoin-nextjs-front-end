// File: components/containers/AssetSelectPanels/RecipientSelectPanel.tsx
'use client';

import { useMemo, useCallback } from 'react';
import type { Address } from 'viem';
import { TokenContract, SP_COIN_DISPLAY, WalletAccount } from '@/lib/structure';

import AssetSelectPanel from './AssetSelectPanel';
import { useExchangeContext } from '@/lib/context/hooks';
import type { AssetSelectBag } from '@/lib/context/structure/types/panelBag';

import { AssetSelectProvider } from '@/lib/context';
import { AssetSelectDisplayProvider } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';

interface RecipientSelectPanelProps {
  isActive: boolean;
  closePanelCallback: () => void;
  /** Recipient selection returns a WalletAccount */
  setRecipientCallback?: (wallet: WalletAccount) => void; // ← make optional
  /** Included for API symmetry; not usually needed for recipients */
  peerAddress?: string | Address;
}

export default function RecipientSelectPanel({
  isActive,
  closePanelCallback,
  setRecipientCallback,
  peerAddress,
}: RecipientSelectPanelProps) {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const chainId = exchangeContext?.network?.chainId ?? 1;

  const containerType = SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL_LIST;

  const initialPanelBag: AssetSelectBag = useMemo(
    () =>
      ({
        type: containerType,
        chainId,
        ...(peerAddress ? { peerAddress } : {}),
      } as AssetSelectBag),
    [containerType, peerAddress, chainId]
  );

  const instanceId = useMemo(
    () => `RECIPIENT_SELECT_${SP_COIN_DISPLAY[containerType]}_${chainId}`,
    [containerType, chainId]
  );

  const closeForProvider = useCallback(
    (_fromUser: boolean) => {
      closePanelCallback();
    },
    [closePanelCallback]
  );

  // Fallback: if parent didn't provide a callback, commit to ExchangeContext here (keeps provider pure).
  const defaultSetRecipient = useCallback(
    (wallet: WalletAccount) => {
      setExchangeContext(
        (prev) => {
          const next: any = structuredClone(prev);
          next.accounts = next.accounts ?? {};
          next.accounts.recipientAccount = wallet;
          return next;
        },
        'RecipientSelectPanel:autoSetRecipient'
      );
    },
    [setExchangeContext]
  );

  const effectiveSetRecipient = setRecipientCallback ?? defaultSetRecipient;

  // Adapter: provider emits (TokenContract | WalletAccount); this panel wants a WalletAccount.
  const onAssetChosen = useCallback(
    (asset: TokenContract | WalletAccount) => {
      try {
        // Heuristic guard: ignore tokens for this panel
        const looksLikeToken = typeof (asset as any)?.decimals === 'number';
        if (looksLikeToken) return;

        effectiveSetRecipient(asset as WalletAccount);
      } catch (e) {
        console.error('[RecipientSelectPanel] setRecipientCallback failed', e || {});
      }
    },
    [effectiveSetRecipient]
  );

  if (!isActive) return null;

  return (
    <AssetSelectDisplayProvider instanceId={instanceId}>
      <AssetSelectProvider
        key={instanceId}
        closePanelCallback={closeForProvider}
        setSelectedAssetCallback={onAssetChosen}
        containerType={containerType}
        initialPanelBag={initialPanelBag}
      >
        <AssetSelectPanel />
      </AssetSelectProvider>
    </AssetSelectDisplayProvider>
  );
}
