// File: components/views/MeritWalletComponent.tsx
'use client';

import { useCallback } from 'react';
import styles from '@/styles/Exchange.module.css';
import ConnectNetworkButton from '@/components/views/Buttons/Connect/ConnectNetworkButton';
import AgentHeaderContainer from '@/components/views/Headers/AgentHeaderContainer';
import MenuTabHeaderBar from '@/components/views/Headers/MenuTabHeaderBar';
import AddressHeaderBar from '@/components/views/Headers/AddressHeaderBar';
import PanelSubTitle from '@/components/views/Headers/PanelSubTitle';
import RadioOverlayPanelHost from '@/components/views/RadioOverlayPanelHost';
import WalletHeader from '@/components/views/WalletHeader';
import PanelGate from '@/components/utility/PanelGate';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { useSpCoinWallet } from '@/lib/spCoinWallet';
import { SP_COIN_DISPLAY } from '@/lib/structure';


interface Props {
  onExpand?: () => void;
  docked?: boolean;
}

export default function MeritWalletComponent({ onExpand, docked = false }: Props) {
  const { closeWallet } = useSpCoinWallet();
  const { openPanel, closePanel, setPanelVisible } = usePanelTree();

  const walletNetworksVisible = usePanelVisible(SP_COIN_DISPLAY.WALLET_NETWORKS_COMPONENT);
  const menuTabVisible        = usePanelVisible(SP_COIN_DISPLAY.MENU_TAB_HEADER_BAR);

  const title = 'Merit Wallet';

  const handleMenuClick = useCallback(() => {
    setPanelVisible(SP_COIN_DISPLAY.MENU_TAB_HEADER_BAR, !menuTabVisible);
  }, [menuTabVisible, setPanelVisible]);

  const handleNetworkChevron = useCallback(() => {
    if (walletNetworksVisible)
      closePanel(SP_COIN_DISPLAY.WALLET_NETWORKS_COMPONENT, 'MeritWalletComponent:networkChevronClose');
    else
      openPanel(SP_COIN_DISPLAY.WALLET_NETWORKS_COMPONENT, 'MeritWalletComponent:networkChevronOpen');
  }, [closePanel, openPanel, walletNetworksVisible]);

  return (
    <PanelGate panel={SP_COIN_DISPLAY.MERIT_WALLET_COMPONENT}>
      <div className={[
        'flex min-h-[200px] w-[min(570px,calc(100vw-2rem))] flex-col overflow-hidden border border-[#2e3654] bg-[#0b0e19] text-white shadow-2xl pointer-events-auto',
        docked
          ? 'h-full rounded-none border-r-0'
          : 'max-h-[min(1000px,calc(100vh-100px))] rounded-[15px]',
      ].join(' ')}>
        <PanelGate panel={SP_COIN_DISPLAY.WALLET_HEADER} lazyLoad={false}>
          <WalletHeader
            mode="normal"
            title={title}
            leftSlot={
              <ConnectNetworkButton
                showName={false}
                showSymbol={true}
                showChevron={true}
                showConnect={true}
                showDisconnect={false}
                showHoverBg={true}
                trimHorizontalPaddingPx={12}
                onChevronClick={handleNetworkChevron}
                chevronUp={walletNetworksVisible}
              />
            }
            bottomSlot={<AddressHeaderBar />}
            onExpand={onExpand}
            onClose={closeWallet}
          />
        </PanelGate>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <AgentHeaderContainer onMenuClick={handleMenuClick} />
          <div id="UNDEFINED" className="hidden" aria-hidden="true" />
          <div
            id="mainTradingPanel"
            className={styles.mainTradingPanel}
            style={{ transform: 'none', width: '100%', flex: 1, minHeight: 0, maxHeight: '100%', margin: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            <MenuTabHeaderBar />
            <PanelSubTitle />
            <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overscroll-contain flex flex-col">
              <RadioOverlayPanelHost />
            </div>
          </div>
        </div>
      </div>
    </PanelGate>
  );
}
