// File: components/Headers/TradeContainerHeader.tsx
'use client';

import styles from '@/styles/Exchange.module.css';
import Image from 'next/image';
import cog_png from '@/public/assets/miscellaneous/cog.png';
import ConfigPanel from '@/components/views/Config/ConfigPanel';
import { exchangeContextDump } from '@/lib/spCoin/guiUtils';
import { useExchangeContext } from '@/lib/context/hooks';
import ConnectButton from '@/components/Buttons/Connect/ConnectButton';
import { useHeaderController } from '@/lib/context/exchangeContext/hooks/useHeaderController';

export default function TradeContainerHeader() {
  const { exchangeContext } = useExchangeContext();
  const {
    title,
    isConfigOpen,
    onOpenConfig,
    onCloseConfig,
    onClose,
    isTrading,
  } = useHeaderController();

  return (
    <div
      id="TradeContainerHeader"
      className="h-[60px] flex justify-between items-center w-full px-2.5 box-border shrink-0"
    >
      <ConfigPanel showPanel={isConfigOpen} onClose={onCloseConfig as any} />

      <div
        id="SponsorCoinLogo.png"
        onDoubleClick={() => exchangeContextDump(exchangeContext)}
        className={styles.leftLogo}
      >
        <ConnectButton
          showName={false}
          showSymbol={false}
          showChevron={false}
          showConnect={false}
          showDisconnect={false}
          showHoverBg={false}
        />
      </div>

      <h4 id="TradeContainerHeaderTitle" className={styles.center}>
        {title}
      </h4>

      <div className={styles.rightSideControl}>
        {isTrading ? (
          <Image
            src={cog_png}
            alt="Open settings"
            title="Open settings"
            onClick={onOpenConfig}
            className="absolute top-3 right-3 h-5 w-5 object-contain cursor-pointer transition duration-300 hover:rotate-[360deg]"
            priority
          />
        ) : (
          <button
            id="closeSelectionPanelButton"
            type="button"
            aria-label="Close"
            title="Close"
            onClick={onClose}
            className="absolute top-1 right-1 h-10 w-10 rounded-full bg-[#243056] text-[#5981F3] flex items-center justify-center leading-none
                       hover:bg-[#5981F3] hover:text-[#243056] transition-colors text-3xl"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
