'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useConnect } from 'wagmi';

import WalletConnectComponent from '@/components/views/Buttons/Connect/WalletConnectComponent';
import WalletHeader from '@/components/views/WalletHeader';
import MainTradingPanel from '@/components/views/MainTradingPanel';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { useSpCoinWallet } from '@/lib/spCoinWallet';
import { getBlockChainName } from '@/lib/context/helpers/NetworkHelpers';
import { useActiveAccount } from '@/lib/context/hooks/ExchangeContext/nested/accounts/useActiveAccount';
import type { SpCoinWalletAccount } from '@/lib/spCoinWallet';
import { SP_COIN_DISPLAY, STATUS, type spCoinAccount } from '@/lib/structure';
import { normalizeAddress } from '@/lib/utils/address';
import Accounts from '@/lib/spCoinWallet/accounts';
import Networks from '@/lib/spCoinWallet/networks';
import WalletOptions from '@/lib/spCoinWallet/walletOptions';

export default function SpCoinWalletPopup() {
  const {
    isOpen,
    closeWallet,
    session,
    walletSource,
    hardhatAccounts,
    hardhatAccountsLoading,
    hardhatAccountsError,
    refreshHardhatAccounts,
    selectionRequest,
    selectAccount,
  } = useSpCoinWallet();
  const [, setActiveAccount] = useActiveAccount();
  const { connectAsync, connectors, status: connectStatus } = useConnect();
  const [previewAccount, setPreviewAccount] = useState<spCoinAccount | undefined>(undefined);
  const [traceEnabled, setTraceEnabled] = useState(false);
  const [traceOutput, setTraceOutput] = useState<string[]>([]);
  const [selectionAccountsCollapsed, setSelectionAccountsCollapsed] = useState(false);
  const [walletAccountsCollapsed, setWalletAccountsCollapsed] = useState(false);
  const [walletOptionsOpen, setWalletOptionsOpen] = useState(false);
  const [swapTokensOpen, setSwapTokensOpen] = useState(false);
  const wasWalletOpenRef = useRef(false);
  const wasNormalModeRef = useRef(false);
  const tradingVisibilityRestoreRef = useRef<{
    mainTradingPanel: boolean;
    tradingStationPanel: boolean;
    exchangeTradingPair: boolean;
  } | null>(null);
  const { setPanelVisible } = usePanelTree();
  const walletAccountsVisible = usePanelVisible(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT);
  const walletNetworksVisible = usePanelVisible(SP_COIN_DISPLAY.WALLET_NETWORKS_COMPONENT);
  const walletConnectVisible = usePanelVisible(SP_COIN_DISPLAY.WALLET_CONNECT_COMPONENT);
  const mainTradingPanelVisible = usePanelVisible(SP_COIN_DISPLAY.MAIN_TRADING_PANEL);
  const tradingStationPanelVisible = usePanelVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  const exchangeTradingPairVisible = usePanelVisible(SP_COIN_DISPLAY.EXCHANGE_TRADING_PAIR);
  const selectedAddressKey = normalizeAddress(
    selectionRequest?.currentAddress || session.signerAddress || session.activeAccountAddress || '',
  );
  const walletActiveAddressKey = normalizeAddress(
    session.signerAddress || session.activeAccountAddress || '',
  );

  const visibleAccounts = useMemo(() => {
    if (walletSource === 'hardhat') return hardhatAccounts;
    if (session.metamaskAuthorized && session.signerAddress) {
      return [
        {
          address: session.signerAddress,
          label: 'MetaMask Active Account',
          source: 'metamask' as const,
        },
      ];
    }
    return [];
  }, [hardhatAccounts, session.metamaskAuthorized, session.signerAddress, walletSource]);

  const normalizedWorkingAddress = normalizeAddress(
    session.signerAddress || session.activeAccountAddress || '',
  );

  const currentNetworkName = Number.isFinite(session.appChainId) && session.appChainId > 0
    ? getBlockChainName(session.appChainId) || `Chain ${session.appChainId}`
    : 'Unknown Network';
  const currentNetworkTitle = Number.isFinite(session.appChainId) && session.appChainId > 0
    ? `${currentNetworkName} (Chain ID: ${session.appChainId})`
    : currentNetworkName;
  const isSelectionMode = Boolean(selectionRequest);
  const selectionSummary = walletSource === 'hardhat'
    ? `${hardhatAccounts.length} Hardhat account${hardhatAccounts.length === 1 ? '' : 's'}`
    : session.metamaskAuthorized
      ? 'MetaMask authorized account'
      : 'MetaMask not authorized';

  const connectMetaMask = async () => {
    const injected = connectors.find((connector) => connector.id === 'injected') ?? connectors[0];
    if (!injected) return;
    await connectAsync({ connector: injected });
  };

  const trace = (message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}${data ? ': ' + JSON.stringify(data) : ''}`;
    console.log(logMessage);
    if (traceEnabled) {
      setTraceOutput((prev) => [...prev, logMessage]);
    }
  };

  useEffect(() => {
    setSelectionAccountsCollapsed(false);
  }, [selectedAddressKey, walletSource]);

  useEffect(() => {
    setWalletAccountsCollapsed(false);
  }, [walletActiveAddressKey, walletSource]);

  const handleSelectAccount = (account: SpCoinWalletAccount) => {
    trace('handleSelectAccount called', {
      accountAddress: account.address,
      accountLabel: account.label,
      accountSource: account.source,
      selectionRequest: !!selectionRequest,
    });

    trace('Calling selectAccount from context');
    selectAccount(account);

    if (!selectionRequest) {
      trace('Not in selection mode, setting active account');
      const nextActive: spCoinAccount = {
        name: String(account.name || account.label || 'Unnamed account').trim(),
        symbol: String(account.symbol || '').trim(),
        type: 'account',
        website: '',
        description: '',
        status: STATUS.INFO,
        address: account.address as spCoinAccount['address'],
        ...(account.logoURL ? { logoURL: account.logoURL } : {}),
        balance: 0n,
      };

      trace('Built nextActive object', {
        name: nextActive.name,
        address: nextActive.address,
        symbol: nextActive.symbol,
      });

      trace('Calling setActiveAccount');
      setActiveAccount(nextActive);
      trace('setActiveAccount called, state update queued');
    } else {
      trace('In selection mode, skipping active account set');
    }
  };

  const openAccountPanel = (account: SpCoinWalletAccount) => {
    const nextAccount: spCoinAccount = {
      name: String(account.name || account.label || 'Unnamed account').trim(),
      symbol: String(account.symbol || '').trim(),
      type: 'account',
      website: '',
      description: '',
      status: STATUS.INFO,
      address: account.address as spCoinAccount['address'],
      ...(account.logoURL ? { logoURL: account.logoURL } : {}),
      balance: 0n,
    };

    trace('openAccountPanel called', {
      accountAddress: nextAccount.address,
      accountName: nextAccount.name,
      isSelectionMode,
    });

    trace('openAccountPanel using wallet preview mode', {
      accountAddress: nextAccount.address,
    });
    setPreviewAccount(nextAccount);
  };

  const handlePrimaryClose = () => {
    if (previewAccount) {
      setPreviewAccount(undefined);
      return;
    }
    if (swapTokensOpen) {
      setSwapTokensOpen(false);
    }
    closeWallet();
  };

  const restoreTradingVisibility = () => {
    const previous = tradingVisibilityRestoreRef.current;
    if (!previous) return;

    setPanelVisible(
      SP_COIN_DISPLAY.MAIN_TRADING_PANEL,
      previous.mainTradingPanel,
      'SpCoinWalletPopup:restoreMainTradingPanelVisibility',
    );
    setPanelVisible(
      SP_COIN_DISPLAY.TRADING_STATION_PANEL,
      previous.tradingStationPanel,
      'SpCoinWalletPopup:restoreTradingStationPanelVisibility',
    );
    setPanelVisible(
      SP_COIN_DISPLAY.EXCHANGE_TRADING_PAIR,
      previous.exchangeTradingPair,
      'SpCoinWalletPopup:restoreExchangeTradingPairVisibility',
    );
    tradingVisibilityRestoreRef.current = null;
  };

  const openSwapTokensPanel = () => {
    trace('Wallet option selected', { option: 'Swap Tokens' });

    tradingVisibilityRestoreRef.current = {
      mainTradingPanel: mainTradingPanelVisible,
      tradingStationPanel: tradingStationPanelVisible,
      exchangeTradingPair: exchangeTradingPairVisible,
    };

    setWalletOptionsOpen(false);
    setPanelVisible(
      SP_COIN_DISPLAY.WALLET_CONNECT_COMPONENT,
      false,
      'SpCoinWalletPopup:hideWalletConnectForSwapTokens',
    );
    setPanelVisible(
      SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT,
      false,
      'SpCoinWalletPopup:hideWalletAccountsForSwapTokens',
    );
    setPanelVisible(
      SP_COIN_DISPLAY.WALLET_NETWORKS_COMPONENT,
      false,
      'SpCoinWalletPopup:hideWalletNetworksForSwapTokens',
    );
    setPanelVisible(
      SP_COIN_DISPLAY.MAIN_TRADING_PANEL,
      true,
      'SpCoinWalletPopup:showMainTradingPanelForSwapTokens',
    );
    setPanelVisible(
      SP_COIN_DISPLAY.TRADING_STATION_PANEL,
      true,
      'SpCoinWalletPopup:showTradingStationPanelForSwapTokens',
    );
    setPanelVisible(
      SP_COIN_DISPLAY.EXCHANGE_TRADING_PAIR,
      true,
      'SpCoinWalletPopup:showExchangeTradingPairForSwapTokens',
    );
    setSwapTokensOpen(true);
  };

  useEffect(() => {
    if (!isOpen || isSelectionMode || previewAccount || walletOptionsOpen) {
      setPanelVisible(
        SP_COIN_DISPLAY.WALLET_CONNECT_COMPONENT,
        false,
        'SpCoinWalletPopup:hideWalletConnectComponent',
      );
      setPanelVisible(
        SP_COIN_DISPLAY.WALLET_NETWORKS_COMPONENT,
        false,
        'SpCoinWalletPopup:hideWalletNetworksComponent',
      );
      setPanelVisible(
        SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT,
        false,
        'SpCoinWalletPopup:hideWalletAccountsComponentForOptions',
      );
    }
  }, [isOpen, isSelectionMode, previewAccount, setPanelVisible, walletOptionsOpen]);

  useEffect(() => {
    const isNormalMode = isOpen && !isSelectionMode;

    if (!isOpen && wasWalletOpenRef.current) {
      setPanelVisible(
        SP_COIN_DISPLAY.WALLET_NETWORKS_COMPONENT,
        false,
        'SpCoinWalletPopup:hideWalletNetworksOnClose',
      );
      setPanelVisible(
        SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT,
        false,
        'SpCoinWalletPopup:hideWalletAccountsOnClose',
      );
    }

    if (isNormalMode && !wasNormalModeRef.current) {
      setPanelVisible(
        SP_COIN_DISPLAY.WALLET_CONNECT_COMPONENT,
        true,
        'SpCoinWalletPopup:showWalletConnectComponentOnOpen',
      );
      setPanelVisible(
        SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT,
        !walletOptionsOpen,
        'SpCoinWalletPopup:showWalletAccountsOnOpen',
      );
    }

    if (!isNormalMode && wasNormalModeRef.current) {
      setPanelVisible(
        SP_COIN_DISPLAY.WALLET_NETWORKS_COMPONENT,
        false,
        'SpCoinWalletPopup:hideWalletNetworksOnModeChange',
      );
      setPanelVisible(
        SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT,
        false,
        'SpCoinWalletPopup:hideWalletAccountsOnModeChange',
      );
    }

    wasWalletOpenRef.current = isOpen;
    wasNormalModeRef.current = isNormalMode;
  }, [isOpen, isSelectionMode, setPanelVisible, walletOptionsOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverscroll = document.body.style.overscrollBehavior;
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehavior;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'contain';
    document.documentElement.style.overscrollBehavior = 'contain';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overscrollBehavior = previousBodyOverscroll;
      document.documentElement.style.overscrollBehavior = previousHtmlOverscroll;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) return;
    restoreTradingVisibility();
    setSwapTokensOpen(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleWalletOptions = () => {
    trace('Wallet options menu clicked', {
      before: walletOptionsOpen,
      swapTokensOpen,
    });

    if (swapTokensOpen) {
      restoreTradingVisibility();
      setSwapTokensOpen(false);
      setWalletOptionsOpen(true);
      return;
    }

    if (walletOptionsOpen) {
      setWalletOptionsOpen(false);
      setPanelVisible(
        SP_COIN_DISPLAY.WALLET_CONNECT_COMPONENT,
        true,
        'SpCoinWalletPopup:showWalletConnectComponentAfterOptions',
      );
      setPanelVisible(
        SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT,
        true,
        'SpCoinWalletPopup:showWalletAccountsComponentAfterOptions',
      );
      return;
    }

    setPanelVisible(
      SP_COIN_DISPLAY.WALLET_CONNECT_COMPONENT,
      false,
      'SpCoinWalletPopup:hideWalletConnectForOptions',
    );
    setPanelVisible(
      SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT,
      false,
      'SpCoinWalletPopup:hideWalletAccountsForOptions',
    );
    setPanelVisible(
      SP_COIN_DISPLAY.WALLET_NETWORKS_COMPONENT,
      false,
      'SpCoinWalletPopup:hideWalletNetworksForOptions',
    );
    setWalletOptionsOpen(true);
  };

  const popupShellClassName = swapTokensOpen
    ? 'absolute left-1/2 top-1/2 inline-flex w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[15px] border border-[#2e3654] bg-[#0b0e19] text-white shadow-2xl'
    : 'absolute left-1/2 top-1/2 flex max-h-[min(650px,calc(100vh-2rem))] w-[min(520px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[15px] border border-[#2e3654] bg-[#0b0e19] text-white shadow-2xl';

  if (isSelectionMode) {
    return (
      <div className="fixed inset-0 z-[10000] bg-black/35">
        <div
          className={[
            'absolute left-1/2 top-1/2 flex max-h-[min(650px,calc(100vh-2rem))] w-[min(520px,calc(100vw-2rem))] flex-col -translate-x-1/2 -translate-y-1/2 overflow-hidden',
            'rounded-[15px] border border-[#2e3654] bg-[#0b0e19] text-white shadow-2xl',
          ].join(' ')}
          role="dialog"
          aria-modal="true"
          aria-label="Select Network Account"
        >
          <WalletHeader
            mode="selection"
            networkTitle={currentNetworkTitle}
            appChainId={session.appChainId}
            selectionSummary={selectionSummary}
            walletSource={walletSource}
            hardhatAccountsLoading={hardhatAccountsLoading}
            connectStatus={connectStatus}
            onRefresh={() => void refreshHardhatAccounts()}
            onConnectMetaMask={() => void connectMetaMask()}
            onClose={handlePrimaryClose}
          />

          <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <Accounts
              accounts={visibleAccounts}
              walletSource={walletSource}
              selectedAddressKey={selectedAddressKey}
              normalizedWorkingAddress={normalizedWorkingAddress}
              isCollapsed={selectionAccountsCollapsed}
              hardhatAccountsLoading={hardhatAccountsLoading}
              hardhatAccountsError={hardhatAccountsError}
              onOpenAccountPanel={openAccountPanel}
              onSelectAccount={handleSelectAccount}
              onToggleCollapse={() => {
                trace('Selection mode account row chevron toggled', {
                  before: selectionAccountsCollapsed,
                });
                setSelectionAccountsCollapsed((prev) => !prev);
              }}
              onTrace={trace}
              previewAccount={previewAccount}
              onClosePreview={() => setPreviewAccount(undefined)}
            />

            {/* Trace Controls */}
            <div className="border-t border-slate-700/50 px-5 py-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="wallet-trace-toggle"
                  checked={traceEnabled}
                  onChange={(e) => {
                    setTraceEnabled(e.target.checked);
                    if (!e.target.checked) setTraceOutput([]);
                  }}
                  className="h-4 w-4 cursor-pointer"
                />
                <label htmlFor="wallet-trace-toggle" className="text-sm text-[#91a5ff] cursor-pointer">
                  Trace Selection
                </label>
              </div>
            </div>

            {/* Trace Output */}
            {traceEnabled && traceOutput.length > 0 && (
              <div className="border-t border-slate-700/50 px-5 py-3 max-h-48 overflow-y-auto bg-[#0a0d16]">
                <div className="text-xs font-mono text-[#7893ff] space-y-1">
                  {traceOutput.map((line, idx) => (
                    <div key={idx} className="text-[#91a5ff]">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[10000] bg-black/35">
      <div
        className={popupShellClassName}
        role="dialog"
        aria-modal="true"
        aria-label="SponsorCoin Wallet"
      >
        <WalletHeader
          mode="normal"
          title={swapTokensOpen ? 'Swap Tokens' : walletOptionsOpen ? 'Wallet Options' : 'SponsorCoin Wallet'}
          onMenuClick={toggleWalletOptions}
          onClose={handlePrimaryClose}
        />

      <div className={swapTokensOpen ? 'min-h-0 flex-1 overflow-visible' : 'min-h-0 flex-1 overflow-hidden'}>
        {swapTokensOpen ? (
          <MainTradingPanel embeddedInPopup />
        ) : null}

        {!swapTokensOpen && walletConnectVisible ? (
          <div className="shrink-0 border-b border-slate-700/50 px-4 py-3">
            <WalletConnectComponent
              showHoverBg={false}
              trimHorizontalPaddingPx={0}
              allowWalletModal={false}
            />
          </div>
        ) : null}

        {walletOptionsOpen ? (
          <WalletOptions
            onSelectOption={(label) => {
                if (label === 'Swap Tokens') {
                  openSwapTokensPanel();
                }
              }}
            />
          ) : null}

          {walletNetworksVisible ? <Networks /> : null}

          {walletAccountsVisible ? (
            <Accounts
              accounts={visibleAccounts}
              walletSource={walletSource}
              selectedAddressKey={walletActiveAddressKey}
              normalizedWorkingAddress={normalizedWorkingAddress}
              isCollapsed={walletAccountsCollapsed}
              hardhatAccountsLoading={hardhatAccountsLoading}
              hardhatAccountsError={hardhatAccountsError}
              onOpenAccountPanel={openAccountPanel}
              onSelectAccount={handleSelectAccount}
              onToggleCollapse={() => {
                trace('Wallet account row chevron toggled account list collapse', {
                  before: walletAccountsCollapsed,
                });
                setWalletAccountsCollapsed((prev) => !prev);
              }}
              onTrace={trace}
              previewAccount={previewAccount}
              onClosePreview={() => setPreviewAccount(undefined)}
            />
          ) : null}
      </div>

        {!swapTokensOpen ? (
          <>
            {/* Trace Controls */}
            <div className="shrink-0 border-t border-slate-700/50 px-5 py-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="wallet-trace-toggle"
                  checked={traceEnabled}
                  onChange={(e) => {
                    setTraceEnabled(e.target.checked);
                    if (!e.target.checked) setTraceOutput([]);
                  }}
                  className="h-4 w-4 cursor-pointer"
                />
                <label htmlFor="wallet-trace-toggle" className="text-sm text-[#91a5ff] cursor-pointer">
                  Trace Selection
                </label>
              </div>
            </div>

            {/* Trace Output */}
            {traceEnabled && traceOutput.length > 0 && (
              <div className="max-h-48 shrink-0 overflow-y-auto border-t border-slate-700/50 bg-[#0a0d16] px-5 py-3">
                <div className="text-xs font-mono text-[#7893ff] space-y-1">
                  {traceOutput.map((line, idx) => (
                    <div key={idx} className="text-[#91a5ff]">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
