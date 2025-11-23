// File: @/components/Buttons/Connect/ConnectNetworkButton.tsx
'use client';

import React from 'react';
import { ConnectKitButton } from 'connectkit';
import { useChainId, useConnect, useConnectors, useDisconnect, useSwitchChain } from 'wagmi';
import { useAppChainId } from '@/lib/context/hooks';

import ConnectMainButton from './ConnectMainButton';
import ConnectDropDown from './ConnectDropDown';

import DropDownPortal from './DropDownPortal';
import { useNetworkOptions } from './hooks/useNetworkOptions';
import { useWalletActions } from './hooks/useWalletActions';
import { useDropDownPortal } from './hooks/useDropDownPortal';
import { usePersistentState } from './hooks/usePersistentState'; // optional

export type ConnectNetworkButtonProps = {
  showName?: boolean;
  showSymbol?: boolean;
  showChevron?: boolean;
  showConnect?: boolean;
  showDisconnect?: boolean;
  showHoverBg?: boolean;
  trimHorizontalPaddingPx?: number;
  allowWalletModal?: boolean;
};

export default function ConnectNetworkButton({
  showName = true,
  showSymbol = true,
  showChevron = true,
  showConnect = true,
  showDisconnect = false,
  showHoverBg = true,
  trimHorizontalPaddingPx,
  allowWalletModal = true,
}: ConnectNetworkButtonProps) {
  // portal/open/position
  const { open, toggle, close, anchorRef, portalRef, pos } = useDropDownPortal();

  // network sets
  const { allOptions, mainnetOptions, testnetOptions, findById } = useNetworkOptions();

  // wagmi
  const { switchChainAsync } = useSwitchChain();
  const { disconnect } = useDisconnect(); 
  const { connectAsync } = useConnect();
  const connectors = useConnectors();
  const walletChainId = useChainId();
  const [appChainId, setAppChainId] = useAppChainId();

  // wallet actions (with cancel/pending guards)
  const { connectMetaMask, switchTo } = useWalletActions({
    allowWalletModal,
    connectors,
    connectAsync,
    disconnect,
    switchChainAsync,
    closeDropdown: close,
  });

  // testnet toggle (persisted)
  const [showTestNets, setShowTestNets] = usePersistentState<boolean>('ck_show_testnets', false);

  return (
    <ConnectKitButton.Custom>
      {({ isConnected, address, truncatedAddress, chain, show }) => {
        // id selection
        const fallbackId = allOptions[0]?.id;
        const baseId =
          (typeof appChainId === 'number' && appChainId > 0 ? appChainId : undefined) ??
          (typeof walletChainId === 'number' && walletChainId > 0 ? walletChainId : undefined) ??
          fallbackId;

        const currentId = isConnected
          ? (chain?.id ?? appChainId ?? walletChainId ?? baseId)
          : baseId;

        // label
        const opt = findById(typeof currentId === 'number' ? currentId : undefined);
        const currentName =
          opt?.name || chain?.name || (typeof currentId === 'number' ? `Chain ${currentId}` : '');
        const currentSymbol = opt?.symbol || (chain as any)?.nativeCurrency?.symbol || '';

        let label = '';
        if (showName && currentName) label = currentName;
        if (showSymbol && currentSymbol) label = label ? `${label} (${currentSymbol})` : currentSymbol;

        // click handlers
        const onButtonClick = toggle;
        const onImageClick = toggle;
        const onChevronClick = toggle;

        const onConnectTextClick =
          !isConnected && showConnect ? () => connectMetaMask(show) : undefined;

        const onDisconnectTextClick =
          isConnected && showDisconnect
            ? () => {
                disconnect();
                close();
              }
            : undefined;

        // dropdown content switches
        const showConnectRowInDropdown = !isConnected && !showConnect;
        const showDisconnectRowInDropdown = isConnected && !showDisconnect;

        // resolve trim px -> Tailwind negative margin classes (no inline styles)
        const resolvedTrimPx =
          typeof trimHorizontalPaddingPx === 'number'
            ? Math.max(0, trimHorizontalPaddingPx)
            : showHoverBg
            ? 0
            : 8;

        const trimClass =
          resolvedTrimPx === 0
            ? ''
            : resolvedTrimPx <= 9 // ~8px
            ? '-ml-2 -mr-2'
            : resolvedTrimPx <= 11 // ~10px
            ? '-ml-2.5 -mr-2.5'
            : resolvedTrimPx <= 13 // ~12px
            ? '-ml-3 -mr-3'
            : '-ml-2 -mr-2'; // fallback

        return (
          <div ref={anchorRef} className="relative m-0 p-0 inline-flex items-center">
            <div className={trimClass}>
              <ConnectMainButton
                currentId={typeof currentId === 'number' ? currentId : undefined}
                label={
                  !isConnected && showConnect
                    ? 'Connect'
                    : isConnected && showDisconnect
                    ? 'Disconnect'
                    : label
                }
                showChevron={showChevron}
                showHoverBg={showHoverBg}
                onButtonClick={onButtonClick}
                onImageClick={onImageClick}
                onChevronClick={onChevronClick}
                onConnectTextClick={onConnectTextClick}
                onDisconnectTextClick={onDisconnectTextClick}
              />
            </div>

            {open && (
              <DropDownPortal top={pos?.top} left={pos?.left} portalRef={portalRef}>
                <ConnectDropDown
                  address={address}
                  truncatedAddress={truncatedAddress}
                  currentId={typeof currentId === 'number' ? currentId : undefined}
                  showHoverBg={showHoverBg}
                  showConnectRow={showConnectRowInDropdown}
                  showDisconnectRow={showDisconnectRowInDropdown}
                  onSelectNetwork={(id) => {
                    setAppChainId(id);
                    switchTo(id, isConnected);
                  }}
                  onConnect={() => connectMetaMask(show)}
                  onDisconnect={() => {
                    disconnect();
                    close();
                  }}
                  onOpenWalletModal={() => {
                    close();
                    if (allowWalletModal) show?.();
                  }}
                  mainnetOptions={mainnetOptions}
                  testnetOptions={testnetOptions}
                  showTestNets={showTestNets}
                  onToggleShowTestNets={() => setShowTestNets((v) => !v)}
                />
              </DropDownPortal>
            )}
          </div>
        );
      }}
    </ConnectKitButton.Custom>
  );
}
