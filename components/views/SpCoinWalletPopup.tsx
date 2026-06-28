'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { MeritWalletLocation } from '@/lib/spCoinWallet/meritWalletStorage';
import { useConnect } from 'wagmi';

import MeritWalletComponent from '@/components/views/MeritWalletComponent';
import WalletHeader from '@/components/views/WalletHeader';
import { useExchangeContext } from '@/lib/context/hooks';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import useOpenAccountComponent from '@/lib/context/hooks/useOpenAccountComponent';
import { useSpCoinWallet } from '@/lib/spCoinWallet';
import { readMeritWalletLS } from '@/lib/spCoinWallet/meritWalletStorage';
import { getBlockChainName } from '@/lib/context/helpers/NetworkHelpers';
import { useActiveAccount } from '@/lib/context/hooks/ExchangeContext/nested/accounts/useActiveAccount';
import type { SpCoinWalletAccount } from '@/lib/spCoinWallet';
import { SP_COIN_DISPLAY, type spCoinAccount } from '@/lib/structure';
import { clearDebugTraceBuffer } from '@/lib/utils/debugTrace';
import Accounts from '@/lib/spCoinWallet/accounts';
import { buildSpCoinAccount } from '@/lib/spCoinWallet/buildSpCoinAccount';
import { useWalletAccountsList } from '@/lib/spCoinWallet/useWalletAccountsList';

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
  const [showBackgroundPage, setShowBackgroundPage] = useState(() => readMeritWalletLS().config.showBackgroundPage);
  const [modalMode, setModalMode] = useState(() => readMeritWalletLS().config.modalMode);
  const [location, setLocationState] = useState<MeritWalletLocation>(
    () => readMeritWalletLS().config.location,
  );
  const isCenter      = location === 'CENTER';
  const isFloating    = location === 'FLOATING';
  const isStickToTop  = location === 'STICK_TO_TOP';
  const isSplitPane   = location === 'SPLIT_PANE';

  // Floating-mode drag state
  const floatPosRef = useRef({ x: 0, y: 0 });
  const [floatPos, setFloatPos] = useState({ x: 0, y: 0 });
  const dragStateRef = useRef<{
    startMouseX: number; startMouseY: number; startPosX: number; startPosY: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const wasWalletOpenRef = useRef(false);
  const wasNormalModeRef = useRef(false);
  const meritWalletRestoreHandledRef = useRef(false);
  const hasPersistedStackRef = useRef(false);

  // Keep floatPosRef in sync so drag-start can read it without stale closure
  useEffect(() => { floatPosRef.current = floatPos; }, [floatPos]);

  // Reset position when switching back to Fixed
  useEffect(() => {
    if (!isFloating) { setFloatPos({ x: 0, y: 0 }); floatPosRef.current = { x: 0, y: 0 }; }
  }, [isFloating]);

  // Listen for live config changes dispatched by WalletConfig
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<Record<string, unknown>>).detail ?? {};
      if (typeof detail.showBackgroundPage === 'boolean') setShowBackgroundPage(detail.showBackgroundPage);
      if (typeof detail.modalMode === 'boolean') setModalMode(detail.modalMode);
      const loc = detail.location;
      if (loc === 'CENTER' || loc === 'FIXED' || loc === 'FLOATING' || loc === 'SPLIT_PANE' || loc === 'STICK_TO_TOP') setLocationState(loc as MeritWalletLocation);
    };
    window.addEventListener('meritWalletConfigChange', handler);
    return () => window.removeEventListener('meritWalletConfigChange', handler);
  }, []);

  // Clamps a floating position so the wallet stays fully within the container bounds.
  // Container: inset-x-0, top-[60px], bottom-0 → width=100vw, height=100vh-60.
  // Wallet is centered at (50%, 50%) with translate offset (x, y).
  const clampFloatPos = (pos: { x: number; y: number }): { x: number; y: number } => {
    const containerH = window.innerHeight - 60;
    const containerW = window.innerWidth;
    const walletH = Math.min(1000, containerH - 40); // mirrors CSS max-h formula
    const walletW = Math.min(520, containerW - 32);   // mirrors CSS w formula (2rem = 32px)
    const halfFreeY = Math.max(0, (containerH - walletH) / 2);
    const halfFreeX = Math.max(0, (containerW - walletW) / 2);
    return {
      x: Math.max(-halfFreeX, Math.min(halfFreeX, pos.x)),
      y: Math.max(-halfFreeY, Math.min(halfFreeY, pos.y)),
    };
  };

  // Mouse-move / mouse-up listeners for dragging (floating) and horizontal sliding (stick-to-top).
  useEffect(() => {
    if (!isFloating && !isStickToTop) return;
    const onMouseMove = (e: MouseEvent) => {
      if (!dragStateRef.current) return;
      const rawX = dragStateRef.current.startPosX + e.clientX - dragStateRef.current.startMouseX;
      const rawY = dragStateRef.current.startPosY + e.clientY - dragStateRef.current.startMouseY;
      // STICK_TO_TOP: only horizontal movement — y is always 0.
      const next = clampFloatPos({ x: rawX, y: isStickToTop ? 0 : rawY });
      floatPosRef.current = next;
      setFloatPos(next);
    };
    const onMouseUp = () => { dragStateRef.current = null; setIsDragging(false); };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isFloating, isStickToTop]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-validate position on viewport resize so the wallet snaps back into bounds.
  useEffect(() => {
    if (!isFloating && !isStickToTop) return;
    const onResize = () => {
      setFloatPos(prev => {
        const clamped = clampFloatPos({ x: prev.x, y: isStickToTop ? 0 : prev.y });
        floatPosRef.current = clamped;
        return clamped;
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isFloating, isStickToTop]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFloatDragStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only drag from the title-bar area (top ~64px), not from interactive elements
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    if (e.clientY - rect.top > 64) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, a, select, [role="button"]')) return;
    e.preventDefault();
    dragStateRef.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startPosX: floatPosRef.current.x,
      startPosY: floatPosRef.current.y,
    };
    setIsDragging(true);
  }, []);

  const { openPanel, setPanelVisible } = usePanelTree();
  const openAccountComponent = useOpenAccountComponent();
  const { exchangeContext } = useExchangeContext();

  // These drive the auto-open guard and the on-open WAC activation guard
  const walletAccountsVisible    = usePanelVisible(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT);
  const tradingStationTabVisible = usePanelVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  const walletConfigTabVisible   = usePanelVisible(SP_COIN_DISPLAY.WALLET_CONFIG_PANEL);
  const rewardsTabVisible        = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
  const sendPanelVisible         = usePanelVisible(SP_COIN_DISPLAY.SEND_PANEL);
  const sponsorPanelVisible      = usePanelVisible(SP_COIN_DISPLAY.SPONSOR_PANEL);
  const tokenListVisible         = usePanelVisible(SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL);
  const meritWalletVisible       = usePanelVisible(SP_COIN_DISPLAY.MERIT_WALLET_COMPONENT);

  const { selectedAddressKey, normalizedWorkingAddress, visibleAccounts } = useWalletAccountsList();
  const currentNetworkName = Number.isFinite(session.appChainId) && session.appChainId > 0
    ? getBlockChainName(session.appChainId) || `Chain ${session.appChainId}`
    : 'Unknown Network';
  const currentNetworkTitle = Number.isFinite(session.appChainId) && session.appChainId > 0
    ? `${currentNetworkName} (Chain ID: ${session.appChainId})`
    : currentNetworkName;
  const isSelectionMode = Boolean(selectionRequest);
  const shouldMountWalletShell = isOpen && (isSelectionMode || meritWalletVisible);
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
  }, [isOpen, isSelectionMode, meritWalletVisible, session.appChainId, session.signerAddress, walletSource]);

  // Restore MERIT_WALLET_COMPONENT only once per wallet-open session.
  // We gate via meritWalletRestoreHandledRef so that subsequent effect re-runs
  // (caused by openPanel becoming a new reference after any context update) do NOT
  // call openPanel again — that would fight intentional tree toggles.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isOpen || isSelectionMode) {
      meritWalletRestoreHandledRef.current = false;
      return;
    }
    if (meritWalletRestoreHandledRef.current) return;
    meritWalletRestoreHandledRef.current = true;
    if (meritWalletVisible) return;
    openPanel(SP_COIN_DISPLAY.MERIT_WALLET_COMPONENT, 'SpCoinWalletPopup:restoreMeritWalletPanel');
  }, [isOpen, isSelectionMode, openPanel, walletSource]);

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

  // Keep hasPersistedStackRef current on every render so the auto-open guards below
  // always see a fresh value even though they intentionally omit panel-visibility from deps.
  useEffect(() => {
    hasPersistedStackRef.current = ((exchangeContext as any)?.settings?.displayStack?.length ?? 0) > 0;
  });

  // Visibility guards are intentionally read as closure values — NOT in deps.
  // Adding them to deps would re-fire this effect on every panel toggle and risk
  // a re-open cycle (same pattern as the auto-open effect below).
  // The values are always current when isOpen/isSelectionMode changes, which is the
  // only transition that matters here.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const isNormalMode = isOpen && !isSelectionMode;

    if (!isOpen && wasWalletOpenRef.current) {
      setPanelVisible(SP_COIN_DISPLAY.WALLET_NETWORKS_COMPONENT, false, 'SpCoinWalletPopup:hideWalletNetworksOnClose');
      setPanelVisible(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT, false, 'SpCoinWalletPopup:hideWalletAccountsOnClose');
    }
    if (isNormalMode && !wasNormalModeRef.current) {
      setPanelVisible(SP_COIN_DISPLAY.WALLET_CONNECT_COMPONENT, true, 'SpCoinWalletPopup:showWalletConnectComponentOnOpen');
      // Only show WAC if no persisted panel stack exists AND no content panel is already active.
      // If a stack exists, the persisted panels will restore themselves; don't overwrite with WAC.
      if (!hasPersistedStackRef.current && !rewardsTabVisible && !tradingStationTabVisible && !walletConfigTabVisible && !sendPanelVisible && !sponsorPanelVisible) {
        setPanelVisible(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT, true, 'SpCoinWalletPopup:showWalletAccountsOnOpen');
      }
    }
    if (!isNormalMode && wasNormalModeRef.current) {
      setPanelVisible(SP_COIN_DISPLAY.WALLET_NETWORKS_COMPONENT, false, 'SpCoinWalletPopup:hideWalletNetworksOnModeChange');
      setPanelVisible(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT, false, 'SpCoinWalletPopup:hideWalletAccountsOnModeChange');
    }
    wasWalletOpenRef.current = isOpen;
    wasNormalModeRef.current = isNormalMode;
  }, [isOpen, isSelectionMode, setPanelVisible]);

  useEffect(() => {
    if (!shouldMountWalletShell) return;
    const prevBodyOverflow   = document.body.style.overflow;
    const prevHtmlOverflow   = document.documentElement.style.overflow;
    const prevBodyOverscroll = document.body.style.overscrollBehavior;
    const prevHtmlOverscroll = document.documentElement.style.overscrollBehavior;

    document.body.classList.add('spcoin-wallet-open');
    document.documentElement.classList.add('spcoin-wallet-open');
    // Only lock page scroll in modal mode; in non-modal mode the background stays scrollable.
    if (modalMode) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'contain';
      document.documentElement.style.overscrollBehavior = 'contain';
    }

    return () => {
      document.body.classList.remove('spcoin-wallet-open');
      document.documentElement.classList.remove('spcoin-wallet-open');
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overscrollBehavior = prevBodyOverscroll;
      document.documentElement.style.overscrollBehavior = prevHtmlOverscroll;
    };
  }, [isSelectionMode, meritWalletVisible, modalMode, shouldMountWalletShell]);

  /* ─── Account helpers (selection mode + auto-open handlers) ─── */

  const openAccountPanel = (account: SpCoinWalletAccount) => {
    const nextAccount = buildSpCoinAccount(account, 'Unnamed account');
    setActiveAccount(nextAccount);
    setPreviewAccount(nextAccount);
    openAccountComponent({
      account: nextAccount,
      mode: SP_COIN_DISPLAY.ACTIVE_ACCOUNT,
      source: 'SpCoinWalletPopup',
    });
  };

  const handleSelectAccount = (account: SpCoinWalletAccount) => {
    selectAccount(account);
    if (!selectionRequest) setActiveAccount(buildSpCoinAccount(account, 'Unnamed account'));
  };

  const handlePrimaryClose = () => {
    if (previewAccount) { setPreviewAccount(undefined); return; }
    closeWallet();
  };

  if (!isOpen || !shouldMountWalletShell) return null;

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
        'fixed inset-x-0 bottom-0 top-[60px] z-[10000] overflow-hidden',
        isFloating || isStickToTop
          ? 'pointer-events-none'
          : isSplitPane
            ? 'flex items-stretch justify-end pointer-events-none'
            : isCenter
              ? 'flex items-center justify-center'
              : 'flex items-start justify-center',
        !isFloating && !isStickToTop && !isSplitPane && !modalMode ? 'pointer-events-none' : '',
        showBackgroundPage ? (isFloating || isStickToTop || isSplitPane ? '' : 'bg-black/35') : 'bg-black',
      ].join(' ')}
      role="dialog"
      aria-modal={isFloating || isStickToTop || isSplitPane ? 'false' : 'true'}
      aria-label="Merit Wallet"
    >
      {isFloating || isStickToTop ? (
        <div
          onMouseDown={handleFloatDragStart}
          style={isStickToTop ? {
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: `translateX(calc(-50% + ${floatPos.x}px))`,
            cursor: isDragging ? 'grabbing' : 'grab',
          } : {
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${floatPos.x}px), calc(-50% + ${floatPos.y}px))`,
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
        >
          <MeritWalletComponent />
        </div>
      ) : (
        <MeritWalletComponent docked={isSplitPane} />
      )}
    </div>
  );
}
