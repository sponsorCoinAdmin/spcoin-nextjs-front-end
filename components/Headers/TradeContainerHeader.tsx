// File: @/components/Headers/TradeContainerHeader.tsx
'use client';

import Image from 'next/image';
import cog_png from '@/public/assets/miscellaneous/cog.png';
import { exchangeContextDump } from '@/lib/spCoin/guiUtils';
import { useExchangeContext } from '@/lib/context/hooks';
import ConnectNetworkButton from '@/components/Buttons/Connect/ConnectNetworkButton';
import { useHeaderController } from '@/lib/context/exchangeContext/hooks/useHeaderController';
import CloseButton from '@/components/Buttons/CloseButton';
import {
  SP_COIN_DISPLAY as SP_TREE,
  type WalletAccount,
} from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { getAccountLogo } from '@/lib/context/helpers/assetHelpers';

export default function TradeContainerHeader() {
  const { exchangeContext } = useExchangeContext();
  const { title, leftElement, onClose, isTrading } = useHeaderController();

  // ⬇️ include closePanel so we can toggle
  const { openPanel, closePanel, isVisible } = usePanelTree();

  const accounts = exchangeContext?.accounts ?? {};
  const recipientAccount = accounts.recipientAccount as
    | WalletAccount
    | undefined;
  const agentAccount = accounts.agentAccount as WalletAccount | undefined;
  const sponsorAccount = accounts.sponsorAccount as WalletAccount | undefined;

  // Use panel visibility to detect which manage detail view is active
  const agentDetailOpen =
    typeof isVisible === 'function'
      ? isVisible(SP_TREE.MANAGE_AGENT_PANEL)
      : false;
  const recipientDetailOpen =
    typeof isVisible === 'function'
      ? isVisible(SP_TREE.MANAGE_RECIPIENT_PANEL)
      : false;
  const sponsorDetailOpen =
    typeof isVisible === 'function'
      ? isVisible(SP_TREE.MANAGE_SPONSOR_PANEL)
      : false;

  let headerWallet: WalletAccount | undefined;
  if (agentDetailOpen && agentAccount) {
    headerWallet = agentAccount;
  } else if (recipientDetailOpen && recipientAccount) {
    headerWallet = recipientAccount;
  } else if (sponsorDetailOpen && sponsorAccount) {
    headerWallet = sponsorAccount;
  }

  const logoSrc = headerWallet ? getAccountLogo(headerWallet) : null;

  const renderLeft = () => {
    // If headerController explicitly provided a leftElement, respect it.
    if (leftElement) return leftElement;

    // If a manage detail panel is open and we have an account, show its (slightly larger) logo
    if (headerWallet && logoSrc) {
      return (
        <div className="flex items-center gap-2">
          <Image
            src={logoSrc}
            alt={headerWallet.name || 'Selected account'}
            title={headerWallet.name || headerWallet.address}
            // 44% larger than 32px -> ~46px
            width={46}
            height={46}
            className="h-[46px] w-[46px] rounded-full object-cover"
          />
        </div>
      );
    }

    // Fallback: original network connect button
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
              const visible =
                typeof isVisible === 'function'
                  ? isVisible(SP_TREE.CONFIG_SLIPPAGE_PANEL)
                  : false;

              if (visible) {
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
            closeCallback={onClose}
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
