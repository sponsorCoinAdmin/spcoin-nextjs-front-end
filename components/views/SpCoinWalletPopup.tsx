'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useConnect } from 'wagmi';

import MeritWalletComponent from '@/components/views/MeritWalletComponent';
import WalletHeader from '@/components/views/WalletHeader';
import { useExchangeContext } from '@/lib/context/hooks';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import useOpenAccountComponent from '@/lib/context/hooks/useOpenAccountComponent';
import { useSpCoinWallet } from '@/lib/spCoinWallet';
import {
  readMeritWalletLS,
  type MeritWalletDefaultPanel,
} from '@/lib/spCoinWallet/meritWalletStorage';
import { getBlockChainName } from '@/lib/context/helpers/NetworkHelpers';
import { useActiveAccount } from '@/lib/context/hooks/ExchangeContext/nested/accounts/useActiveAccount';
import type { SpCoinWalletAccount } from '@/lib/spCoinWallet';
import { SP_COIN_DISPLAY, STATUS, type spCoinAccount } from '@/lib/structure';
import { normalizeAddress } from '@/lib/utils/address';
import { clearDebugTraceBuffer } from '@/lib/utils/debugTrace';
import Accounts from '@/lib/spCoinWallet/accounts';

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
  const [defaultPanel] = useState<MeritWalletDefaultPanel>(
    () => readMeritWalletLS().config.defaultPanel,
  );
  // Read once from localStorage — AccountPanelView owns live updates for these
  const [showBackgroundPage] = useState(() => readMeritWalletLS().config.showBackgroundPage);
  const [modalMode] = useState(() => readMeritWalletLS().config.modalMode);

  const wasWalletOpenRef = useRef(false);
  const wasNormalModeRef = useRef(false);
  const suppressDefaultPanelAutoOpenRef = useRef(false);

  const { openPanel, setPanelVisible } = usePanelTree();
  const openAccountComponent = useOpenAccountComponent();
  const { exchangeContext } = useExchangeContext();

  // These three drive the auto-open guard
  const walletAccountsVisible    = usePanelVisible(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT);
  const tradingStationTabVisible = usePanelVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  const walletConfigTabVisible   = usePanelVisible(SP_COIN_DISPLAY.WALLET_CONFIG_PANEL);

  const selectedAddressKey = normalizeAddress(
    selectionRequest?.currentAddress || session.signerAddress || session.activeAccountAddress || '',
  );
  const visibleAccounts = useMemo(() => {
    if (walletSource === 'hardhat') return hardhatAccounts;
    if (session.metamaskAuthorized && session.signerAddress) {
      return [{ address: session.signerAddress, label: 'MetaMask Active Account', source: 'metamask' as const }];
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
    : session.metamaskAuthorized ? 'MetaMask authorized account' : 'MetaMask not authorized';

  const connectMetaMask = async () => {
    const injected = connectors.find((c) => c.id === 'injected') ?? connectors[0];
    if (!injected) return;
    await connectAsync({ connector: injected });
  };

  /* ─── Panel visibility helpers ─── */

  const setWalletNavigationVisible = useCallback(
    (visible: boolean, reasonPrefix: string) => {
      setPanelVisible(SP_COIN_DISPLAY.WALLET_CONNECT_COMPONENT, visible, `${reasonPrefix}:walletConnect`);
      setPanelVisible(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT, visible, `${reasonPrefix}:walletAccounts`);
      setPanelVisible(SP_COIN_DISPLAY.WALLET_NETWORKS_COMPONENT, visible, `${reasonPrefix}:walletNetworks`);
    },
    [setPanelVisible],
  );

  const setManagePanelsVisible = useCallback(
    (manageSponsorshipsVisible: boolean, accountPanelVisible: boolean, reasonPrefix: string) => {
      setPanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL, manageSponsorshipsVisible, `${reasonPrefix}:manageSponsorships`);
      setPanelVisible(SP_COIN_DISPLAY.ACCOUNT_PANEL, accountPanelVisible, `${reasonPrefix}:accountPanel`);
    },
    [setPanelVisible],
  );

  /* ─── Lifecycle effects ─── */

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

  useEffect(() => {
    if (!isOpen || isSelectionMode || previewAccount) {
      setPanelVisible(SP_COIN_DISPLAY.WALLET_CONNECT_COMPONENT, false, 'SpCoinWalletPopup:hideWalletConnectComponent');
      setPanelVisible(SP_COIN_DISPLAY.WALLET_NETWORKS_COMPONENT, false, 'SpCoinWalletPopup:hideWalletNetworksComponent');
      setPanelVisible(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT, false, 'SpCoinWalletPopup:hideWalletAccountsComponentForOptions');
    }
  }, [isOpen, isSelectionMode, previewAccount, setPanelVisible]);

  useEffect(() => {
    const isNormalMode = isOpen && !isSelectionMode;

    if (!isOpen && wasWalletOpenRef.current) {
      setPanelVisible(SP_COIN_DISPLAY.WALLET_NETWORKS_COMPONENT, false, 'SpCoinWalletPopup:hideWalletNetworksOnClose');
      setPanelVisible(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT, false, 'SpCoinWalletPopup:hideWalletAccountsOnClose');
    }
    if (isNormalMode && !wasNormalModeRef.current) {
      setPanelVisible(SP_COIN_DISPLAY.WALLET_CONNECT_COMPONENT, true, 'SpCoinWalletPopup:showWalletConnectComponentOnOpen');
      setPanelVisible(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT, true, 'SpCoinWalletPopup:showWalletAccountsOnOpen');
    }
    if (!isNormalMode && wasNormalModeRef.current) {
      setPanelVisible(SP_COIN_DISPLAY.WALLET_NETWORKS_COMPONENT, false, 'SpCoinWalletPopup:hideWalletNetworksOnModeChange');
      setPanelVisible(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT, false, 'SpCoinWalletPopup:hideWalletAccountsOnModeChange');
    }
    wasWalletOpenRef.current = isOpen;
    wasNormalModeRef.current = isNormalMode;
  }, [isOpen, isSelectionMode, setPanelVisible]);

  useEffect(() => {
    if (!isOpen) return;
    const prevBodyOverflow   = document.body.style.overflow;
    const prevHtmlOverflow   = document.documentElement.style.overflow;
    const prevBodyOverscroll = document.body.style.overscrollBehavior;
    const prevHtmlOverscroll = document.documentElement.style.overscrollBehavior;

    document.body.classList.add('spcoin-wallet-open');
    document.documentElement.classList.add('spcoin-wallet-open');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'contain';
    document.documentElement.style.overscrollBehavior = 'contain';

    return () => {
      document.body.classList.remove('spcoin-wallet-open');
      document.documentElement.classList.remove('spcoin-wallet-open');
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overscrollBehavior = prevBodyOverscroll;
      document.documentElement.style.overscrollBehavior = prevHtmlOverscroll;
    };
  }, [isOpen]);

  /* ─── Account helpers (selection mode + auto-open handlers) ─── */

  const buildSpCoinAccount = (account: SpCoinWalletAccount | spCoinAccount, fallbackName: string): spCoinAccount => ({
    name: String((account as any).name || (account as any).label || fallbackName).trim(),
    symbol: String((account as any).symbol || '').trim(),
    type: 'account',
    website: '',
    description: '',
    status: STATUS.INFO,
    address: account.address as spCoinAccount['address'],
    ...((account as any).logoURL ? { logoURL: (account as any).logoURL } : {}),
    balance: 0n,
  });

  const openAccountPanel = (account: SpCoinWalletAccount) => {
    setActiveAccount(buildSpCoinAccount(account, 'Unnamed account'));
    suppressDefaultPanelAutoOpenRef.current = true;
    openPanel(SP_COIN_DISPLAY.ACCOUNT_PANEL, 'SpCoinWalletPopup:openAccountPanel');
  };

  const handleSelectAccount = (account: SpCoinWalletAccount) => {
    selectAccount(account);
    if (!selectionRequest) setActiveAccount(buildSpCoinAccount(account, 'Unnamed account'));
  };

  const handlePrimaryClose = () => {
    if (previewAccount) { setPreviewAccount(undefined); return; }
    closeWallet();
  };

  /* ─── Default-panel auto-open handlers ─── */

  const openWalletOptions = useCallback(() => {
    openPanel(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT, 'SpCoinWalletPopup:openAccountsForOptions');
  }, [openPanel]);

  const openTradeStationDefaultPanel = useCallback(() => {
    setWalletNavigationVisible(false, 'SpCoinWalletPopup:hideForTradeStationDefault');
    setManagePanelsVisible(false, false, 'SpCoinWalletPopup:hideForTradeStationDefault');
    setPanelVisible(SP_COIN_DISPLAY.MAIN_TRADING_PANEL, true, 'SpCoinWalletPopup:showMainTradingPanel');
    openPanel(SP_COIN_DISPLAY.TRADING_STATION_PANEL, 'SpCoinWalletPopup:openTradingStationPanel');
    setPanelVisible(SP_COIN_DISPLAY.EXCHANGE_TRADING_PAIR, true, 'SpCoinWalletPopup:showExchangeTradingPair');
  }, [openPanel, setManagePanelsVisible, setPanelVisible, setWalletNavigationVisible]);

  const openManageRewardsPanel = useCallback(() => {
    suppressDefaultPanelAutoOpenRef.current = true;
    setWalletNavigationVisible(false, 'SpCoinWalletPopup:hideForManageRewardsDefault');
    setPanelVisible(SP_COIN_DISPLAY.MAIN_TRADING_PANEL, true, 'SpCoinWalletPopup:showMainTradingPanel');
    setPanelVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL, false, 'SpCoinWalletPopup:hideTradingStation');
    setManagePanelsVisible(true, false, 'SpCoinWalletPopup:showForManageRewards');
    openPanel(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL, 'SpCoinWalletPopup:openManageSponsorships');
  }, [openPanel, setManagePanelsVisible, setPanelVisible, setWalletNavigationVisible]);

  const openManageAccountPanel = useCallback(() => {
    const activeAccount = exchangeContext?.accounts?.activeAccount;
    if (!activeAccount) return;
    suppressDefaultPanelAutoOpenRef.current = true;
    const nextAccount = buildSpCoinAccount(activeAccount, 'Active Account');
    openAccountComponent({ account: nextAccount, mode: SP_COIN_DISPLAY.ACTIVE_ACCOUNT, source: 'SpCoinWalletPopup:ManageAccount' });
    setPreviewAccount(nextAccount);
  }, [exchangeContext?.accounts?.activeAccount, openAccountComponent]);

  const openSponsorPanel = useCallback(() => {
    const sourceAccount = exchangeContext?.accounts?.sponsorAccount ?? exchangeContext?.accounts?.activeAccount;
    if (!sourceAccount) return;
    suppressDefaultPanelAutoOpenRef.current = true;
    const nextAccount = buildSpCoinAccount(sourceAccount, 'Sponsor Account');
    openAccountComponent({ account: nextAccount, mode: SP_COIN_DISPLAY.SPONSOR_ACCOUNT, source: 'SpCoinWalletPopup:Sponsor' });
    setPreviewAccount(nextAccount);
  }, [exchangeContext?.accounts?.activeAccount, exchangeContext?.accounts?.sponsorAccount, openAccountComponent]);

  const openOptionsPanel = useCallback(() => {
    suppressDefaultPanelAutoOpenRef.current = true;
    openPanel(SP_COIN_DISPLAY.WALLET_CONFIG_PANEL, 'SpCoinWalletPopup:openOptionsPanel');
  }, [openPanel]);

  const defaultPanelHandlersRef = useRef({
    openManageAccountPanel, openManageRewardsPanel, openOptionsPanel,
    openSponsorPanel, openTradeStationDefaultPanel, openWalletOptions,
  });
  useEffect(() => {
    defaultPanelHandlersRef.current = {
      openManageAccountPanel, openManageRewardsPanel, openOptionsPanel,
      openSponsorPanel, openTradeStationDefaultPanel, openWalletOptions,
    };
  });

  // Panel visibility guards are read as closure values — intentionally NOT in deps.
  // Including them caused a re-open cycle: hiding WAC triggered this effect, which re-opened WAC.
  // This effect should only fire on wallet open/close or defaultPanel change, not on panel toggles.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isOpen || isSelectionMode) return;
    if (walletAccountsVisible || walletConfigTabVisible || tradingStationTabVisible) return;
    if (suppressDefaultPanelAutoOpenRef.current) { suppressDefaultPanelAutoOpenRef.current = false; return; }
    const h = defaultPanelHandlersRef.current;
    if (defaultPanel === 'MENU')    { h.openWalletOptions();            return; }
    if (defaultPanel === 'ACCOUNT') { h.openManageAccountPanel();       return; }
    if (defaultPanel === 'REWARDS') { h.openManageRewardsPanel();       return; }
    if (defaultPanel === 'SWAP')    { h.openTradeStationDefaultPanel(); return; }
    if (defaultPanel === 'SPONSOR') { h.openSponsorPanel();             return; }
    if (defaultPanel === 'OPTIONS') { h.openOptionsPanel(); }
  }, [defaultPanel, isOpen, isSelectionMode]);

  if (!isOpen) return null;

  /* ─── Selection mode: account picker (self-contained) ─── */
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
              onToggleCollapse={() => setSelectionAccountsCollapsed((prev) => !prev)}
              previewAccount={previewAccount}
              onClosePreview={() => setPreviewAccount(undefined)}
            />
          </div>
        </div>
      </div>
    );
  }

  /* ─── Normal mode: backdrop + shared MeritWalletComponent ─── */
  return (
    <div
      className={[
        'fixed inset-x-0 bottom-0 top-[60px] z-[10000]',
        'flex items-center justify-center',
        modalMode ? '' : 'pointer-events-none',
        showBackgroundPage ? 'bg-black/35' : 'bg-[#050711]',
      ].join(' ')}
      role="dialog"
      aria-modal="true"
      aria-label="SponsorCoin Wallet"
    >
      <MeritWalletComponent />
    </div>
  );
}
