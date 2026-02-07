// File: @/components/Headers/TradeContainerHeader.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import cog_png from '@/public/assets/miscellaneous/cog.png';
import { exchangeContextDump } from '@/lib/spCoin/guiUtils';
import { useExchangeContext } from '@/lib/context/hooks';
import ConnectNetworkButton from '@/components/views/Buttons/Connect/ConnectNetworkButton';
import { useHeaderController } from '@/lib/context/exchangeContext/hooks/useHeaderController';
import CloseButton from '@/components/views/Buttons/CloseButton';
import { SP_COIN_DISPLAY as SP_TREE, type spCoinAccount } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { getAccountLogo } from '@/lib/context/helpers/assetHelpers';
import { createDebugLogger } from '@/lib/utils/debugLogger';

// ✅ NEW: prevent “double close” when header X also triggers overlay close handlers
import { suppressNextOverlayClose } from '@/lib/context/exchangeContext/hooks/useOverlayCloseHandler';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_TRADE_HEADER === 'true';

const debugLog = createDebugLogger('TradeContainerHeader', DEBUG_ENABLED, LOG_TIME);

export default function TradeContainerHeader() {
  const { exchangeContext } = useExchangeContext();
  const { title, leftElement, onClose, isTrading } = useHeaderController();

  // ✅ New contract: usePanelTree exposes ONLY openPanel/closePanel as the public API.
  const { openPanel, closePanel, isVisible } = usePanelTree();
 
  let headerWallet: spCoinAccount | undefined;

  const logoSrc = headerWallet ? getAccountLogo(headerWallet) : null;

  const renderLeft = () => {
    if (leftElement) return leftElement;

    if (headerWallet && logoSrc) {
      return (
        <div className="flex items-center gap-2">
          <Image
            src={logoSrc}
            alt={headerWallet.name || 'Selected account'}
            title={headerWallet.name || headerWallet.address}
            width={46}
            height={46}
            className="h-[46px] w-[46px] rounded-full object-cover"
          />
        </div>
      );
    }

    return (
      <ConnectNetworkButton
        showName={false}
        showSymbol={false}
        showChevron={false}
        showConnect={false}
        showDisconnect={false}
        showHoverBg={false}
      />
    );
  };

  /**
   * ✅ Header X does ONE thing:
   * - delegate to useHeaderController.onClose(e)
   *
   * Also:
   * - suppress the next overlay close attempt (one-shot) to prevent double close.
   */
  const handleHeaderClose = (e?: React.MouseEvent) => {
    debugLog.log?.('handleHeaderClose clicked', { title, isTrading });

    // one-shot suppress in case an overlay/backdrop handler runs too
    suppressNextOverlayClose(
      `TradeContainerHeader:X:${String(title ?? '')}`,
      'TradeContainerHeader',
    );

    try {
      e?.preventDefault();
      e?.stopPropagation();
    } catch {}

    onClose?.(e);
  };

  return (
    <div
      id="TradeContainerHeader"
      className="grid grid-cols-[auto_1fr_auto] items-center w-full box-border h-[50px] min-h-[50px] py-0 px-0 shrink-0 my-[3px]"
    >
      <div
        id="SponsorCoinLogo.png"
        onDoubleClick={() => exchangeContextDump(exchangeContext)}
        className="flex items-center my-0 pl-0 ml-0"
      >
        {renderLeft()}
      </div>

      <h4 className="justify-self-center m-0 leading-none text-base font-semibold select-none text-center">
        {title}
      </h4>

      <div className="flex items-center justify-end my-0">
        {isTrading ? (
          <Image
            src={cog_png}
            alt="Open slippage settings"
            title="Open slippage settings"
            onClick={() => {
              const visible = isVisible(SP_TREE.CONFIG_SLIPPAGE_PANEL);

              debugLog.log?.('slippage cog clicked', { currentlyVisible: visible });

              if (visible) {
                // ✅ closePanel(panel) hides that panel (and removes from stack if it’s a stack member)
                closePanel(
                  SP_TREE.CONFIG_SLIPPAGE_PANEL,
                  'TradeContainerHeader:cog(toggle-close CONFIG_SLIPPAGE_PANEL)',
                );
              } else {
                openPanel(
                  SP_TREE.CONFIG_SLIPPAGE_PANEL,
                  'TradeContainerHeader:cog(toggle-open CONFIG_SLIPPAGE_PANEL)',
                );
              }
            }}
            className="h-5 w-5 object-contain cursor-pointer transition duration-300 hover:rotate-[360deg]"
            priority
          />
        ) : (
          <CloseButton
            closeCallback={handleHeaderClose}
            className="
              absolute top-2 right-[27px] h-10 w-10 rounded-full
              bg-[#243056] text-[#5981F3] flex items-center justify-center
              leading-none transition-colors text-3xl
              hover:bg-[#5981F3] hover:text-[#243056]
            "
          />
        )}
      </div>
    </div>
  );
}
