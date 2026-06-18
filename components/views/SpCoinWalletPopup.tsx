'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useConnect } from 'wagmi';

import ConnectNetworkButton from '@/components/views/Buttons/Connect/ConnectNetworkButton';
import AgentWalletPanel from '@/components/views/AgentWalletPanel';
import WalletConfig from '@/components/views/WalletConfig';
import WalletHeader from '@/components/views/WalletHeader';
import { useExchangeContext } from '@/lib/context/hooks';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import useOpenAccountComponent from '@/lib/context/hooks/useOpenAccountComponent';
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
import {
  appendDebugTrace,
  clearDebugTraceBuffer,
} from '@/lib/utils/debugTrace';
import Accounts from '@/lib/spCoinWallet/accounts';
import Networks from '@/lib/spCoinWallet/networks';
import TokenListSelectPanel from '@/components/views/RadioOverlayPanels/ListSelectPanels/TokenListSelectPanel';
import AccountPanelView from '@/components/views/RadioOverlayPanels/AccountPanel/AccountPanelView';
import AccountPanelTabBar from '@/components/views/RadioOverlayPanels/AccountPanel/AccountPanelTabBar';
import ActiveAccount from '@/components/views/RadioOverlayPanels/AccountPanel/ActiveAccount';

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
  const [selectionAccountsCollapsed, setSelectionAccountsCollapsed] = useState(false);
  const [walletAccountsCollapsed, setWalletAccountsCollapsed] = useState(false);
  const [walletOptionsOpen, setWalletOptionsOpen] = useState(false);
  const [swapTokensOpen, setSwapTokensOpen] = useState(false);
  const [walletConfigOpen, setWalletConfigOpen] = useState(false);
  const [tabsOpen, setTabsOpen] = useState(true);

  const [showBackgroundPage, setShowBackgroundPage] = useState(
    () => readMeritWalletLS().config.showBackgroundPage,
  );
  const [defaultPanel, setDefaultPanel] = useState<MeritWalletDefaultPanel>(
    () => readMeritWalletLS().config.defaultPanel,
  );
  const [modalMode, setModalMode] = useState<boolean>(
    () => readMeritWalletLS().config.modalMode,
  );
  const wasWalletOpenRef = useRef(false);
  const wasNormalModeRef = useRef(false);
  const suppressDefaultPanelAutoOpenRef = useRef(false);
  const tradingVisibilityRestoreRef = useRef<{
    mainTradingPanel: boolean;
    tradingStationPanel: boolean;
    exchangeTradingPair: boolean;
  } | null>(null);
  const { openPanel, closePanel, setPanelVisible } = usePanelTree();
  const openAccountComponent = useOpenAccountComponent();
  const { exchangeContext } = useExchangeContext();
  const walletAccountsVisible = usePanelVisible(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT);
  const walletNetworksVisible = usePanelVisible(SP_COIN_DISPLAY.WALLET_NETWORKS_COMPONENT);
  const tokenListVisible = usePanelVisible(SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL);
  const accountPanelVisible = usePanelVisible(SP_COIN_DISPLAY.ACCOUNT_PANEL);
  // Tab sub-panels: keep AccountPanelView mounted when any of its tabs are active
  const rewardsTabVisible = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
  const tradingStationTabVisible = usePanelVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  const walletConfigTabVisible = usePanelVisible(SP_COIN_DISPLAY.WALLET_CONFIG_PANEL);
  const showAccountPanelView = accountPanelVisible || rewardsTabVisible || tradingStationTabVisible || walletConfigTabVisible;
  const activeAccountType = rewardsTabVisible ? 'Deposit Account' : tradingStationTabVisible ? 'Trading Account' : 'Active Account';
  const selectedAddressKey = normalizeAddress(
    selectionRequest?.currentAddress || session.signerAddress || session.activeAccountAddress || '',
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
    appendDebugTrace(message, data);
  };

  type WalletPopupResetOptions = {
    preview?: boolean;
    walletOptions?: boolean;
    walletConfig?: boolean;
    swapTokens?: boolean;
    suppressDefaultPanelAutoOpen?: boolean;
  };

  const resetWalletPopupState = useCallback((options: WalletPopupResetOptions = {}) => {
    const {
      preview = false,
      walletOptions = false,
      walletConfig = false,
      swapTokens = false,
      suppressDefaultPanelAutoOpen = false,
    } = options;

    if (preview) setPreviewAccount(undefined);
    if (walletOptions) setWalletOptionsOpen(false);
    if (walletConfig) setWalletConfigOpen(false);
    if (swapTokens) setSwapTokensOpen(false);
    if (suppressDefaultPanelAutoOpen) {
      suppressDefaultPanelAutoOpenRef.current = true;
    }
  }, []);

  const setWalletNavigationVisible = useCallback(
    (visible: boolean, reasonPrefix: string) => {
      setPanelVisible(
        SP_COIN_DISPLAY.WALLET_CONNECT_COMPONENT,
        visible,
        `${reasonPrefix}:walletConnect`,
      );
      setPanelVisible(
        SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT,
        visible,
        `${reasonPrefix}:walletAccounts`,
      );
      setPanelVisible(
        SP_COIN_DISPLAY.WALLET_NETWORKS_COMPONENT,
        visible,
        `${reasonPrefix}:walletNetworks`,
      );
    },
    [setPanelVisible],
  );

  const setManagePanelsVisible = useCallback(
    (manageSponsorshipsVisible: boolean, accountPanelVisible: boolean, reasonPrefix: string) => {
      setPanelVisible(
        SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
        manageSponsorshipsVisible,
        `${reasonPrefix}:manageSponsorships`,
      );
      setPanelVisible(
        SP_COIN_DISPLAY.ACCOUNT_PANEL,
        accountPanelVisible,
        `${reasonPrefix}:accountPanel`,
      );
    },
    [setPanelVisible],
  );

  useEffect(() => {
    if (!isOpen || wasWalletOpenRef.current) {
      wasWalletOpenRef.current = isOpen;
      return;
    }

    clearDebugTraceBuffer();
    wasWalletOpenRef.current = true;
  }, [isOpen]);

  useEffect(() => {
    setSelectionAccountsCollapsed(false);
  }, [selectedAddressKey, walletSource]);

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

  const openSharedAccountPanel = (account: spCoinAccount, source: string) => {
    openAccountComponent({
      account,
      mode: SP_COIN_DISPLAY.ACTIVE_ACCOUNT,
      source,
    });
    setPreviewAccount(account);
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

    setActiveAccount(nextAccount);
    // Suppress the auto-open effect (dep: walletOptionsOpen) from re-opening WAC
    // when we clear walletOptionsOpen below.
    suppressDefaultPanelAutoOpenRef.current = true;
    openPanel(SP_COIN_DISPLAY.ACCOUNT_PANEL, 'SpCoinWalletPopup:openAccountPanel');
    if (walletOptionsOpen) setWalletOptionsOpen(false);
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

  useEffect(() => {
    if (!isOpen || isSelectionMode || previewAccount || walletConfigOpen) {
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
  }, [isOpen, isSelectionMode, previewAccount, setPanelVisible, walletConfigOpen]);

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
        true,
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

  }, [isOpen]);

  useEffect(() => {
    updateMeritWalletLS((previous) => ({
      ...previous,
      config: {
        ...previous.config,
        showBackgroundPage,
        modalMode,
        defaultPanel,
      },
    }));
  }, [defaultPanel, modalMode, showBackgroundPage]);

  const openWalletOptions = () => {
    trace('Wallet menu opened', {
      before: walletOptionsOpen,
      swapTokensOpen,
      walletConfigOpen,
    });
    if (swapTokensOpen) {
      restoreTradingVisibility();
      resetWalletPopupState({ swapTokens: true });
    }

    if (walletConfigOpen) {
      resetWalletPopupState({ walletConfig: true });
    }

    openPanel(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT, 'SpCoinWalletPopup:openAccountsForOptions');
    setWalletOptionsOpen(true);
  };

  const openTradeStationDefaultPanel = useCallback(() => {

    resetWalletPopupState({ walletOptions: true, walletConfig: true });
    setWalletNavigationVisible(false, 'SpCoinWalletPopup:hideForTradeStationDefault');
    setManagePanelsVisible(false, false, 'SpCoinWalletPopup:hideForTradeStationDefault');
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
  }, [
    openPanel,
    resetWalletPopupState,
    setManagePanelsVisible,
    setPanelVisible,
    setWalletNavigationVisible,
  ]);

  const openManageRewardsPanel = useCallback(() => {
    trace('Opening manage rewards panel', {
      activeAccountAddress: String(exchangeContext?.accounts?.activeAccount?.address ?? '').trim(),
    });
    resetWalletPopupState({ walletOptions: true, walletConfig: true, preview: true, suppressDefaultPanelAutoOpen: true });
    setSwapTokensOpen(true);
    setWalletNavigationVisible(false, 'SpCoinWalletPopup:hideForManageRewardsDefault');
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
    setManagePanelsVisible(true, false, 'SpCoinWalletPopup:showForManageRewardsDefault');
    openPanel(
      SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
      'SpCoinWalletPopup:openManageSponsorshipsPanelForManageRewards',
    );
  }, [
    exchangeContext?.accounts?.activeAccount,
    openPanel,
    resetWalletPopupState,
    setManagePanelsVisible,
    setPanelVisible,
    setWalletNavigationVisible,
  ]);

  const openManageAccountPanel = useCallback(() => {
    trace('Opening manage account panel', {
      activeAccountAddress: String(exchangeContext?.accounts?.activeAccount?.address ?? '').trim(),
    });
    const activeAccount = exchangeContext?.accounts?.activeAccount;
    if (!activeAccount) return;

    resetWalletPopupState({
      preview: true,
      walletOptions: true,
      walletConfig: true,
      swapTokens: true,
      suppressDefaultPanelAutoOpen: true,
    });
    trace('Manage account popup state cleared', {
      previewCleared: true,
      walletOptionsOpen: false,
      walletConfigOpen: false,
      swapTokensOpen: false,
    });

    const nextAccount: spCoinAccount = {
      address: String(activeAccount.address ?? '').trim() as spCoinAccount['address'],
      name: String(activeAccount.name ?? '').trim() || 'Active Account',
      symbol: String(activeAccount.symbol ?? '').trim(),
      type: 'account',
      website: '',
      description: '',
      status: STATUS.INFO,
      ...(activeAccount.logoURL ? { logoURL: activeAccount.logoURL } : {}),
      balance: 0n,
    };

    openSharedAccountPanel(nextAccount, 'SpCoinWalletPopup:ManageAccount');
    trace('Manage account preview opened', {
      accountAddress: nextAccount.address,
      accountName: nextAccount.name,
    });
  }, [exchangeContext?.accounts?.activeAccount, resetWalletPopupState]);

  const openSponsorPanel = useCallback(() => {
    const sourceAccount =
      exchangeContext?.accounts?.sponsorAccount ?? exchangeContext?.accounts?.activeAccount;

    trace('Opening sponsor panel', {
      sponsorAccountAddress: String(sourceAccount?.address ?? '').trim(),
    });

    if (!sourceAccount) return;

    resetWalletPopupState({
      preview: true,
      walletOptions: true,
      walletConfig: true,
      swapTokens: true,
      suppressDefaultPanelAutoOpen: true,
    });

    const nextAccount: spCoinAccount = {
      address: String(sourceAccount.address ?? '').trim() as spCoinAccount['address'],
      name: String(sourceAccount.name ?? '').trim() || 'Sponsor Account',
      symbol: String(sourceAccount.symbol ?? '').trim(),
      type: 'account',
      website: '',
      description: '',
      status: STATUS.INFO,
      ...(sourceAccount.logoURL ? { logoURL: sourceAccount.logoURL } : {}),
      balance: 0n,
    };

    openAccountComponent({
      account: nextAccount,
      mode: SP_COIN_DISPLAY.SPONSOR_ACCOUNT,
      source: 'SpCoinWalletPopup:Sponsor',
    });
    setPreviewAccount(nextAccount);

    trace('Sponsor preview opened', {
      accountAddress: nextAccount.address,
      accountName: nextAccount.name,
    });
  }, [
    exchangeContext?.accounts?.activeAccount,
    exchangeContext?.accounts?.sponsorAccount,
    openAccountComponent,
    resetWalletPopupState,
  ]);

  const openOptionsPanel = useCallback(() => {
    trace('Opening options panel');
    resetWalletPopupState({
      preview: true,
      walletOptions: true,
      swapTokens: true,
      suppressDefaultPanelAutoOpen: true,
    });
    setWalletConfigOpen(true);
  }, [resetWalletPopupState]);


  // Ref holding the latest version of all default-panel handlers.
  // This is the "useEvent" pattern: the auto-open effect below reads handlers
  // via this ref so it doesn't need to depend on them.  Without this, every
  // setActiveAccount() call recreates openManageAccountPanel (dep:
  // exchangeContext.accounts.activeAccount), which re-fires the auto-open
  // effect and races against openPanel(ACCOUNT_PANEL).
  const defaultPanelHandlersRef = useRef({
    openManageAccountPanel,
    openManageRewardsPanel,
    openOptionsPanel,
    openSponsorPanel,
    openTradeStationDefaultPanel,
    openWalletOptions,
  });
  // No deps — runs every render to keep the ref current.
  useEffect(() => {
    defaultPanelHandlersRef.current = {
      openManageAccountPanel,
      openManageRewardsPanel,
      openOptionsPanel,
      openSponsorPanel,
      openTradeStationDefaultPanel,
      openWalletOptions,
    };
  });

  // Auto-open: fires only when user-intent changes (isOpen, defaultPanel, mode
  // flags), NOT when internal callbacks update due to context changes.
  useEffect(() => {
    if (!isOpen || isSelectionMode) return;
    if (walletOptionsOpen || walletConfigOpen || swapTokensOpen) return;
    if (suppressDefaultPanelAutoOpenRef.current) {
      suppressDefaultPanelAutoOpenRef.current = false;
      return;
    }

    const h = defaultPanelHandlersRef.current;
    if (defaultPanel === 'MENU')    { h.openWalletOptions();              return; }
    if (defaultPanel === 'ACCOUNT') { h.openManageAccountPanel();         return; }
    if (defaultPanel === 'REWARDS') { h.openManageRewardsPanel();         return; }
    if (defaultPanel === 'SWAP')    { h.openTradeStationDefaultPanel();   return; }
    if (defaultPanel === 'SPONSOR') { h.openSponsorPanel();               return; }
    if (defaultPanel === 'OPTIONS') { h.openOptionsPanel(); }
  }, [defaultPanel, isOpen, isSelectionMode, walletOptionsOpen, walletConfigOpen, swapTokensOpen]);

  const handleWalletNetworkChevronClick = useCallback(() => {
    if (walletNetworksVisible) {
      closePanel(SP_COIN_DISPLAY.WALLET_NETWORKS_COMPONENT, 'SpCoinWalletPopup:networkChevronClose');
    } else {
      openPanel(SP_COIN_DISPLAY.WALLET_NETWORKS_COMPONENT, 'SpCoinWalletPopup:networkChevronOpen');
    }
  }, [openPanel, closePanel, walletNetworksVisible]);

  const popupShellClassName = [
    'absolute left-1/2 top-1/2 flex h-[min(650px,calc(100vh-230px))] min-h-[300px] w-[min(520px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden',
    'rounded-[15px] border border-[#2e3654] bg-[#0b0e19] text-white shadow-2xl pointer-events-auto',
  ].join(' ');

  if (!isOpen) return null;

  if (isSelectionMode) {
    return (
      <div className="fixed inset-x-0 bottom-0 top-[60px] z-[10000] bg-[#050711]">
        <div
          className={[
            'absolute left-1/2 top-1/2 flex h-[min(650px,calc(100vh-230px))] min-h-[300px] w-[min(520px,calc(100vw-2rem))] flex-col -translate-x-1/2 -translate-y-1/2 overflow-hidden',
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

          </div>
        </div>

      </div>
    );
  }

  return (
    <div
      className={[
        'fixed inset-x-0 bottom-0 top-[60px] z-[10000]',
        modalMode ? '' : 'pointer-events-none',
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
              : tradingStationTabVisible
                ? 'Trading Station'
                : rewardsTabVisible
                  ? 'Account Rewards'
                  : walletOptionsOpen
                    ? 'Merit Wallet'
                    : 'SponsorCoin Wallet'
          }
          onMenuClick={() => {
            setTabsOpen((p) => !p);
          }}
          menuButtonKind="menu"
          leftSlot={
            <ConnectNetworkButton
              showName={false}
              showSymbol={true}
              showChevron={true}
              showConnect={true}
              showDisconnect={false}
              showHoverBg={true}
              onChevronClick={handleWalletNetworkChevronClick}
              chevronUp={walletNetworksVisible}
            />
          }
          onClose={handlePrimaryClose}
        />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {swapTokensOpen ? <AgentWalletPanel /> : null}

          {walletConfigOpen ? (
            <div className="min-h-0 flex-1 overflow-hidden flex flex-col px-4">
              <WalletConfig
                showBackgroundPage={showBackgroundPage}
                onShowBackgroundPageChange={setShowBackgroundPage}
                modalMode={modalMode}
                onModalModeChange={setModalMode}
                defaultPanel={defaultPanel}
                onDefaultPanelChange={setDefaultPanel}
              />
            </div>
          ) : null}

          {!swapTokensOpen && !walletConfigOpen ? (
            <>
              {/* Tab bar — top-level chrome, outside the radio group */}
              <AccountPanelTabBar open={tabsOpen} />

              {/* Nav row — top-level chrome, outside the radio group */}
              <div className="relative shrink-0 border-b border-slate-700/50 px-4 py-3 flex items-center gap-3">
                <div className="pointer-events-none absolute inset-x-0 top-[2px] flex flex-col items-center text-[19px] font-semibold text-[#5981F3]">
                  <span>{activeAccountType}</span>
                  {exchangeContext?.accounts?.activeAccount?.name && (
                    <span>{exchangeContext.accounts.activeAccount.name}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => closePanel('SpCoinWalletPopup:back')}
                  className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#303b68] hover:bg-[#3c487a]"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-5 w-5 text-[#91a5ff]" />
                </button>
              </div>

              {/* Active account row — top-level chrome, outside the radio group */}
              <ActiveAccount
                account={exchangeContext?.accounts?.activeAccount}
                accountType={activeAccountType}
                showTitle={false}
              />

              {/* Account panel — mounted when ACCOUNT_PANEL or any of its tab sub-panels is the active radio member */}
              {showAccountPanelView ? (
                <AccountPanelView
                  account={exchangeContext?.accounts?.activeAccount}
                  onModalModeChange={setModalMode}
                />
              ) : null}

              {/* Accounts list — radio-exclusive with ACCOUNT_PANEL */}
              {walletAccountsVisible ? (
                <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  <Accounts
                    accounts={visibleAccounts}
                    walletSource={walletSource}
                    selectedAddressKey={selectedAddressKey}
                    normalizedWorkingAddress={normalizedWorkingAddress}
                    isCollapsed={walletAccountsCollapsed}
                    hardhatAccountsLoading={hardhatAccountsLoading}
                    hardhatAccountsError={hardhatAccountsError}
                    onOpenAccountPanel={openAccountPanel}
                    onSelectAccount={(account) => {
                      handleSelectAccount(account);
                      closePanel(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT, 'SpCoinWalletPopup:selectAndClose');
                    }}
                    onToggleCollapse={() => setWalletAccountsCollapsed((prev) => !prev)}
                    onTrace={trace}
                    previewAccount={previewAccount}
                    onClosePreview={() => setPreviewAccount(undefined)}
                  />
                </div>
              ) : null}

              {/* Networks list — radio-exclusive with ACCOUNT_PANEL */}
              {walletNetworksVisible ? <Networks /> : null}

              {/* Token list — opens from Swap tab chevron */}
              {tokenListVisible ? (
                <div className="scrollbar-hide min-h-0 flex-1 overflow-hidden px-4">
                  <TokenListSelectPanel />
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
