// File: @/components/views/Buttons/Connect/ConnectNetworkButton.tsx
'use client';

import React from 'react';
import { ConnectKitButton } from 'connectkit';
import {
  useChainId as useWalletChainId,
  useConnect,
  useConnectors,
  useDisconnect,
  useSwitchChain,
} from 'wagmi';
import { useAppChainId, useExchangeContext } from '@/lib/context/hooks';

import ConnectMainButton from './ConnectMainButton';
import ConnectDropDown from './ConnectDropDown';

import DropDownPortal from './DropDownPortal';
import { useNetworkOptions } from './hooks/useNetworkOptions';
import { useWalletActions } from './hooks/useWalletActions';
import { useDropDownPortal } from './hooks/useDropDownPortal';
import {
  toggleShowTestNetsUpdater,
  resolveAppChainId,
  getEffectiveChainId,
} from '@/lib/utils/network';

export type ConnectNetworkButtonProps = {
  showName?: boolean;
  showSymbol?: boolean;
  showNetworkIcon?: boolean;
  showChevron?: boolean;
  showConnect?: boolean;
  showDisconnect?: boolean;
  showHoverBg?: boolean;
  titleDisplay?: boolean;
  trimHorizontalPaddingPx?: number;
  allowWalletModal?: boolean;
  connectLabel?: string;
};

export default function ConnectNetworkButton({
  showName = true,
  showSymbol = true,
  showNetworkIcon = true,
  showChevron = true,
  showConnect = true,
  showDisconnect = false,
  showHoverBg = true,
  titleDisplay = false,
  trimHorizontalPaddingPx,
  allowWalletModal = true,
  connectLabel = 'Connect',
}: ConnectNetworkButtonProps) {
  // portal/open/position
  const { open, toggle, close, anchorRef, portalRef, pos } = useDropDownPortal();

  // network sets
  const { allOptions, mainnetOptions, testnetOptions, findById } = useNetworkOptions();

  // wagmi + app network
  const { switchChainAsync } = useSwitchChain();
  const { disconnect } = useDisconnect();
  const { connectAsync } = useConnect();
  const connectors = useConnectors();

  // 🔹 Wallet chain id (wallet-only; not app SSoT)
  const walletChainId = useWalletChainId();

  // 🔹 App chain id (single source of truth for UI/network selection)
  const [appChainId, setAppChainId] = useAppChainId();
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  // wallet actions (with cancel/pending guards)
  const { connectMetaMask, switchTo } = useWalletActions({
    allowWalletModal,
    connectors,
    connectAsync,
    disconnect,
    switchChainAsync,
    closeDropdown: close,
  });

  // testnet toggle (persisted in ExchangeContext.settings)
  const showTestNets = Boolean(exchangeContext?.settings?.showTestNets);

  React.useEffect(() => {
    // Cleanup legacy standalone key after migration.
    window.localStorage.removeItem('ck_show_testnets');
  }, []);

  return (
    <ConnectKitButton.Custom>
      {({ isConnected, address, truncatedAddress, chain, show }) => {
        const normalizedAppChainId = resolveAppChainId(appChainId);
        const normalizedWalletChainId = resolveAppChainId(walletChainId);
        const normalizedChainId = resolveAppChainId(chain?.id);
        const fallbackId = resolveAppChainId(allOptions[0]?.id);

        // 🔹 Base id for app/network selection:
        //     appChainId (SSoT) → ConnectKit chain → wallet chain → first option
        const baseId = getEffectiveChainId({
          appChainId: normalizedAppChainId,
          walletChainId: normalizedChainId ?? normalizedWalletChainId,
          fallbackChainId: fallbackId,
        });

        // 🔹 Current network id for display & dropdown
        // When connected, we *still* let appChainId lead; ConnectKit chain is
        // informational, but the app's idea of "active network" is appChainId.
        const currentId =
          (isConnected
            ? normalizedAppChainId ?? normalizedChainId ?? normalizedWalletChainId
            : normalizedAppChainId) ?? baseId;

        const numericCurrentId = resolveAppChainId(currentId, baseId);

        // label
        const opt = findById(numericCurrentId);
        const currentName =
          opt?.name ||
          chain?.name ||
          (typeof numericCurrentId === 'number'
            ? `Chain ${numericCurrentId}`
            : '');

        const currentSymbol =
          opt?.symbol || (chain as any)?.nativeCurrency?.symbol || '';

        let label = '';
        if (showName && currentName) label = currentName;
        if (showSymbol && currentSymbol) {
          label = label ? `${label} (${currentSymbol})` : currentSymbol;
        }

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
                currentId={numericCurrentId}
                label={
                  !isConnected && showConnect
                    ? connectLabel
                    : isConnected && showDisconnect
                    ? 'Disconnect'
                    : label
                }
                showNetworkIcon={showNetworkIcon}
                showChevron={showChevron}
                showHoverBg={showHoverBg}
                titleDisplay={titleDisplay}
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
                  currentId={numericCurrentId}
                  showHoverBg={showHoverBg}
                  showConnectRow={showConnectRowInDropdown}
                  showDisconnectRow={showDisconnectRowInDropdown}
                  onSelectNetwork={(id) => {
                    // 🔹 First update app-level network (SSoT)
                    setAppChainId(id);
                    // 🔹 Then sync wallet if connected
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
                  onToggleShowTestNets={() =>
                    setExchangeContext(
                      toggleShowTestNetsUpdater,
                      'ConnectNetworkButton:onToggleShowTestNets',
                    )
                  }
                />
              </DropDownPortal>
            )}
          </div>
        );
      }}
    </ConnectKitButton.Custom>
  );
}
