'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useConnect } from 'wagmi';

import WalletConnectComponent from '@/components/views/Buttons/Connect/WalletConnectComponent';
import AgentWalletPanel from '@/components/views/AgentWalletPanel';
import WalletConfig from '@/components/views/WalletConfig';
import WalletHeader from '@/components/views/WalletHeader';
import { useExchangeContext } from '@/lib/context/hooks';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { useSpCoinWallet } from '@/lib/spCoinWallet';
import {
  readMeritWalletLS,
  updateMeritWalletLS,
  type MeritWalletDefaultPanel,
} from '@/lib/spCoinWallet/meritWalletStorage';
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
  const [walletConfigOpen, setWalletConfigOpen] = useState(false);
  const [agentPanelMode, setAgentPanelMode] = useState<'trade' | 'manage'>('trade');
  const [walletOptionsReturnMode, setWalletOptionsReturnMode] = useState<
    'normal' | 'swap' | 'manage' | 'config'
  >('normal');
  const [showBackgroundPage, setShowBackgroundPage] = useState(
    () => readMeritWalletLS().config.showBackgroundPage,
  );
  const [defaultPanel, setDefaultPanel] = useState<MeritWalletDefaultPanel>(
    () => readMeritWalletLS().config.defaultPanel,
  );
  const wasWalletOpenRef = useRef(false);
  const wasNormalModeRef = useRef(false);
  const suppressDefaultPanelAutoOpenRef = useRef(false);
  const tradingVisibilityRestoreRef = useRef<{
    mainTradingPanel: boolean;
    tradingStationPanel: boolean;
    exchangeTradingPair: boolean;
  } | null>(null);
  const { openPanel, setPanelVisible } = usePanelTree();
  const { exchangeContext } = useExchangeContext();
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
    if (walletConfigOpen) {
      setWalletConfigOpen(false);
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
    suppressDefaultPanelAutoOpenRef.current = true;

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
      SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
      false,
      'SpCoinWalletPopup:hideManageSponsorshipsForSwapTokens',
    );
    setPanelVisible(
      SP_COIN_DISPLAY.ACCOUNT_PANEL,
      false,
      'SpCoinWalletPopup:hideAccountPanelForSwapTokens',
    );
    setPanelVisible(
      SP_COIN_DISPLAY.MAIN_TRADING_PANEL,
      true,
      'SpCoinWalletPopup:showMainTradingPanelForSwapTokens',
    );
    openPanel(
      SP_COIN_DISPLAY.TRADING_STATION_PANEL,
      'SpCoinWalletPopup:openTradingStationPanelForSwapTokens',
    );
    setPanelVisible(
      SP_COIN_DISPLAY.EXCHANGE_TRADING_PAIR,
      true,
      'SpCoinWalletPopup:showExchangeTradingPairForSwapTokens',
    );
    setSwapTokensOpen(true);
  };

  useEffect(() => {
    if (!isOpen || isSelectionMode || previewAccount || walletOptionsOpen || walletConfigOpen) {
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
  }, [isOpen, isSelectionMode, previewAccount, setPanelVisible, walletConfigOpen, walletOptionsOpen]);

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

    document.body.classList.add('spcoin-wallet-open');
    document.documentElement.classList.add('spcoin-wallet-open');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'contain';
    document.documentElement.style.overscrollBehavior = 'contain';

    return () => {
      document.body.classList.remove('spcoin-wallet-open');
      document.documentElement.classList.remove('spcoin-wallet-open');
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
    setWalletConfigOpen(false);
    setWalletOptionsReturnMode('normal');
    setAgentPanelMode('trade');
  }, [isOpen]);

  useEffect(() => {
    updateMeritWalletLS((previous) => ({
      ...previous,
      config: {
        ...previous.config,
        showBackgroundPage,
        defaultPanel,
      },
    }));
  }, [defaultPanel, showBackgroundPage]);

  const openWalletOptions = () => {
    trace('Wallet menu opened', {
      before: walletOptionsOpen,
      swapTokensOpen,
      walletConfigOpen,
    });
    setWalletOptionsReturnMode('normal');

    if (swapTokensOpen) {
      restoreTradingVisibility();
      setSwapTokensOpen(false);
      setWalletOptionsReturnMode(agentPanelMode === 'manage' ? 'manage' : 'swap');
    }

    if (walletConfigOpen) {
      setWalletConfigOpen(false);
      setWalletOptionsReturnMode('config');
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

  const openTradeStationDefaultPanel = useCallback(() => {
    setAgentPanelMode('trade');
    setWalletOptionsOpen(false);
    setWalletConfigOpen(false);
    setPanelVisible(
      SP_COIN_DISPLAY.WALLET_CONNECT_COMPONENT,
      false,
      'SpCoinWalletPopup:hideWalletConnectForTradeStationDefault',
    );
    setPanelVisible(
      SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT,
      false,
      'SpCoinWalletPopup:hideWalletAccountsForTradeStationDefault',
    );
    setPanelVisible(
      SP_COIN_DISPLAY.WALLET_NETWORKS_COMPONENT,
      false,
      'SpCoinWalletPopup:hideWalletNetworksForTradeStationDefault',
    );
    setPanelVisible(
      SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
      false,
      'SpCoinWalletPopup:hideManageSponsorshipsForTradeStationDefault',
    );
    setPanelVisible(
      SP_COIN_DISPLAY.ACCOUNT_PANEL,
      false,
      'SpCoinWalletPopup:hideAccountPanelForTradeStationDefault',
    );
    setPanelVisible(
      SP_COIN_DISPLAY.MAIN_TRADING_PANEL,
      true,
      'SpCoinWalletPopup:showMainTradingPanelForTradeStationDefault',
    );
    openPanel(
      SP_COIN_DISPLAY.TRADING_STATION_PANEL,
      'SpCoinWalletPopup:openTradingStationPanelForTradeStationDefault',
    );
    setPanelVisible(
      SP_COIN_DISPLAY.EXCHANGE_TRADING_PAIR,
      true,
      'SpCoinWalletPopup:showExchangeTradingPairForTradeStationDefault',
    );
    setSwapTokensOpen(true);
  }, [openPanel, setPanelVisible]);

  const openManageRewardsDefaultPanel = useCallback(() => {
    trace('Opening manage rewards default panel', {
      activeAccountAddress: String(exchangeContext?.accounts?.activeAccount?.address ?? '').trim(),
    });
    suppressDefaultPanelAutoOpenRef.current = true;
    setAgentPanelMode('manage');
    setWalletOptionsReturnMode('manage');
    setWalletOptionsOpen(false);
    setWalletConfigOpen(false);
    setSwapTokensOpen(true);
    setPanelVisible(
      SP_COIN_DISPLAY.WALLET_CONNECT_COMPONENT,
      false,
      'SpCoinWalletPopup:hideWalletConnectForManageRewardsDefault',
    );
    setPanelVisible(
      SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT,
      false,
      'SpCoinWalletPopup:hideWalletAccountsForManageRewardsDefault',
    );
    setPanelVisible(
      SP_COIN_DISPLAY.WALLET_NETWORKS_COMPONENT,
      false,
      'SpCoinWalletPopup:hideWalletNetworksForManageRewardsDefault',
    );
    setPanelVisible(
      SP_COIN_DISPLAY.MAIN_TRADING_PANEL,
      true,
      'SpCoinWalletPopup:showMainTradingPanelForManageRewardsDefault',
    );
    setPanelVisible(
      SP_COIN_DISPLAY.TRADING_STATION_PANEL,
      false,
      'SpCoinWalletPopup:hideTradingStationForManageRewardsDefault',
    );
    setPanelVisible(
      SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
      true,
      'SpCoinWalletPopup:showManageSponsorshipsForManageRewardsDefault',
    );
    setPanelVisible(
      SP_COIN_DISPLAY.ACCOUNT_PANEL,
      false,
      'SpCoinWalletPopup:hideAccountPanelForManageRewardsDefault',
    );
    openPanel(
      SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
      'SpCoinWalletPopup:openManageSponsorshipsPanelForManageRewardsDefault',
    );
  }, [exchangeContext?.accounts?.activeAccount, openPanel, setPanelVisible]);

  const openManageAccountPanel = useCallback(() => {
    trace('Opening manage account panel', {
      activeAccountAddress: String(exchangeContext?.accounts?.activeAccount?.address ?? '').trim(),
    });
    const activeAccount = exchangeContext?.accounts?.activeAccount;
    if (!activeAccount) return;

    suppressDefaultPanelAutoOpenRef.current = true;
    setWalletOptionsOpen(false);
    setWalletConfigOpen(false);
    setSwapTokensOpen(false);

    openAccountPanel({
      address: String(activeAccount.address ?? '').trim(),
      label: String(activeAccount.name ?? '').trim() || 'Active Account',
      name: String(activeAccount.name ?? '').trim() || 'Active Account',
      symbol: String(activeAccount.symbol ?? '').trim(),
      logoURL: activeAccount.logoURL,
      source: walletSource,
    });
  }, [exchangeContext?.accounts?.activeAccount, openAccountPanel, walletSource]);

  const returnFromWalletOptions = () => {
    trace('Returning from wallet options', {
      walletOptionsReturnMode,
    });

    setWalletOptionsOpen(false);

    if (walletOptionsReturnMode === 'swap') {
      openTradeStationDefaultPanel();
      return;
    }

    if (walletOptionsReturnMode === 'manage') {
      openManageRewardsDefaultPanel();
      return;
    }

    if (walletOptionsReturnMode === 'config') {
      setWalletConfigOpen(true);
      return;
    }

    setPanelVisible(
      SP_COIN_DISPLAY.WALLET_CONNECT_COMPONENT,
      true,
      'SpCoinWalletPopup:returnFromWalletOptionsShowWalletConnect',
    );
    setPanelVisible(
      SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT,
      true,
      'SpCoinWalletPopup:returnFromWalletOptionsShowWalletAccounts',
    );
  };

  const returnToWalletOptions = () => {
    trace('Returning to wallet options', {
      swapTokensOpen,
      walletConfigOpen,
    });

    if (swapTokensOpen) {
      restoreTradingVisibility();
      setSwapTokensOpen(false);
      setWalletOptionsReturnMode(agentPanelMode === 'manage' ? 'manage' : 'swap');
    }

    if (walletConfigOpen) {
      setWalletConfigOpen(false);
      setWalletOptionsReturnMode('config');
    }

    setWalletOptionsOpen(true);
  };

  const headerActionIsBack = walletConfigOpen || walletOptionsOpen;

  useEffect(() => {
    if (!isOpen || isSelectionMode) return;
    if (walletOptionsOpen || walletConfigOpen || swapTokensOpen) return;
    if (suppressDefaultPanelAutoOpenRef.current) {
      suppressDefaultPanelAutoOpenRef.current = false;
      return;
    }

    if (defaultPanel === 'MENU') {
      openWalletOptions();
      return;
    }

    if (defaultPanel === 'TRADE_STATION') {
      openTradeStationDefaultPanel();
      return;
    }

    if (defaultPanel === 'MANAGE_REWARDS') {
      openManageRewardsDefaultPanel();
    }
  }, [
    defaultPanel,
    isOpen,
    isSelectionMode,
    openManageRewardsDefaultPanel,
    openTradeStationDefaultPanel,
    swapTokensOpen,
    walletConfigOpen,
    walletOptionsOpen,
  ]);

  const handleWalletNetworkChevronClick = useCallback(() => {
    trace('Wallet network chevron clicked', {
      wasVisible: walletNetworksVisible,
      walletOptionsOpen,
    });
    setWalletOptionsOpen(false);
    setPanelVisible(
      SP_COIN_DISPLAY.WALLET_NETWORKS_COMPONENT,
      !walletNetworksVisible,
      'SpCoinWalletPopup:toggleWalletNetworksViaChevron',
    );
    if (!walletNetworksVisible) {
      setPanelVisible(
        SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT,
        false,
        'SpCoinWalletPopup:hideWalletAccountsWhenOpeningNetworks',
      );
    }
  }, [setPanelVisible, trace, walletNetworksVisible, walletOptionsOpen]);

  const handleWalletAccountChevronClick = useCallback(() => {
    trace('Wallet account chevron clicked', {
      wasVisible: walletAccountsVisible,
      walletOptionsOpen,
    });
    setWalletOptionsOpen(false);
    setPanelVisible(
      SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT,
      !walletAccountsVisible,
      'SpCoinWalletPopup:toggleWalletAccountsViaChevron',
    );
    if (!walletAccountsVisible) {
      setPanelVisible(
        SP_COIN_DISPLAY.WALLET_NETWORKS_COMPONENT,
        false,
        'SpCoinWalletPopup:hideWalletNetworksWhenOpeningAccounts',
      );
    }
  }, [setPanelVisible, trace, walletAccountsVisible, walletOptionsOpen]);

  const popupShellClassName = [
    'absolute left-1/2 top-1/2 flex max-h-[min(650px,calc(100vh-60px-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden',
    'rounded-[15px] border border-[#2e3654] bg-[#0b0e19] text-white shadow-2xl',
    swapTokensOpen
      ? 'w-[min(560px,calc(100vw-2rem))]'
      : walletOptionsOpen
        ? 'w-[min(700px,calc(100vw-2rem))]'
      : 'w-[min(520px,calc(100vw-2rem))]',
  ].join(' ');

  if (!isOpen) return null;

  if (isSelectionMode) {
    return (
      <div className="fixed inset-x-0 bottom-0 top-[60px] z-[10000] bg-[#050711]">
        <div
          className={[
            'absolute left-1/2 top-1/2 flex max-h-[min(650px,calc(100vh-60px-2rem))] w-[min(520px,calc(100vw-2rem))] flex-col -translate-x-1/2 -translate-y-1/2 overflow-hidden',
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
    <div
      className={[
        'fixed inset-x-0 bottom-0 top-[60px] z-[10000]',
        showBackgroundPage ? 'bg-black/35' : 'bg-[#050711]',
      ].join(' ')}
    >
        <div
          className={popupShellClassName}
          role="dialog"
          aria-modal="true"
          aria-label="SponsorCoin Wallet"
        >
        <WalletHeader
          mode="normal"
          title={
            walletConfigOpen
              ? 'Wallet Config'
              : walletOptionsOpen
                ? 'Merit Wallet Options'
                : 'SponsorCoin Wallet'
          }
          onMenuClick={
            walletConfigOpen
              ? returnToWalletOptions
              : walletOptionsOpen
                ? returnFromWalletOptions
                : swapTokensOpen
                  ? openWalletOptions
                  : openWalletOptions
          }
          menuButtonKind={headerActionIsBack ? 'back' : 'menu'}
          onClose={handlePrimaryClose}
        />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {swapTokensOpen ? <AgentWalletPanel /> : null}

        {walletConfigOpen ? (
          <WalletConfig
            showBackgroundPage={showBackgroundPage}
            onShowBackgroundPageChange={setShowBackgroundPage}
            defaultPanel={defaultPanel}
            onDefaultPanelChange={setDefaultPanel}
            onManageRewardsOpen={openManageRewardsDefaultPanel}
          />
        ) : null}

        {!swapTokensOpen &&
        !walletConfigOpen &&
        !previewAccount &&
        (walletConnectVisible || walletOptionsOpen) ? (
          <div className="shrink-0 border-b border-slate-700/50 px-4 py-3">
            <WalletConnectComponent
              showHoverBg={false}
              trimHorizontalPaddingPx={0}
              allowWalletModal={false}
              onNetworkChevronClick={handleWalletNetworkChevronClick}
              onAccountChevronClick={handleWalletAccountChevronClick}
            />
          </div>
        ) : null}

        {!swapTokensOpen && walletOptionsOpen ? (
          <WalletOptions
            onSelectOption={(label) => {
              trace('Wallet option selected', { option: label });

              if (label === 'Manage Account') {
                openManageAccountPanel();
                return;
              }

              if (label === 'Manage Rewards') {
                openManageRewardsDefaultPanel();
                return;
              }

              if (label === 'Swap Tokens') {
                openSwapTokensPanel();
                return;
              }

              if (label === 'Config') {
                setWalletOptionsOpen(false);
                setWalletConfigOpen(true);
              }
            }}
            />
          ) : null}

        {!swapTokensOpen && !walletConfigOpen && !previewAccount && walletNetworksVisible ? (
          <Networks />
        ) : null}

          {!swapTokensOpen && !walletConfigOpen && walletAccountsVisible ? (
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

        {!swapTokensOpen && !walletConfigOpen ? (
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
