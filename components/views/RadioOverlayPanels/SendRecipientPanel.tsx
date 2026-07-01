'use client';

import { useCallback } from 'react';
import type { Address } from 'viem';

import { SP_COIN_DISPLAY, STATUS } from '@/lib/structure';
import type { spCoinAccount } from '@/lib/structure';
import { useExchangeContext, useSendTokenContract } from '@/lib/context/hooks';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { defaultMissingImage } from '@/lib/context/helpers/assetHelpers';
import AccountSelectDropDown from '@/components/views/TradingStationPanel/AssetSelectDropDowns/AccountSelectDropDown';
import { useWalletAccountsList } from '@/components/wallet/lib/useWalletAccountsList';
import { useGetBalance } from '@/lib/hooks/useGetBalance';
import { useNativeToken } from '@/lib/hooks/useNativeToken';

export default function SendRecipientPanel() {
  const { exchangeContext } = useExchangeContext();
  const { openPanel, closePanel } = usePanelTree();
  const { visibleAccounts } = useWalletAccountsList();
  const recipientPickerVisible = usePanelVisible(SP_COIN_DISPLAY.SEND_RECIPIENT_SELECT_PANEL);
  const [sendTokenContract] = useSendTokenContract();
  const nativeToken = useNativeToken();

  const token = sendTokenContract ?? nativeToken;
  const tokenAddr = token?.address as Address | undefined;
  const tokenDecimals = token?.decimals ?? 18;

  const toAddress = (exchangeContext.accounts?.sendRecipientAddress ?? '') as string;
  const recipientLogoURL = (exchangeContext.accounts?.sendRecipientLogoURL as string | undefined) ?? defaultMissingImage;

  const matchedAccount = toAddress
    ? visibleAccounts.find((a) => a.address.toLowerCase() === toAddress.toLowerCase())
    : undefined;

  const sendRecipientAccount: spCoinAccount | undefined = toAddress
    ? {
        name: matchedAccount?.name ?? matchedAccount?.label ?? '',
        symbol: matchedAccount?.symbol ?? '',
        type: '',
        website: matchedAccount?.website ?? '',
        description: matchedAccount?.description ?? '',
        status: STATUS.CONNECTED,
        address: toAddress as `0x${string}`,
        logoURL: matchedAccount?.logoURL ?? recipientLogoURL,
        balance: 0n,
      }
    : undefined;

  const recipientAddr = toAddress as Address | undefined;
  const { formatted: recipientBalance, isLoading: recipientBalanceLoading, error: recipientBalanceError } = useGetBalance({
    tokenAddress: tokenAddr,
    userAddress: recipientAddr && /^0x[a-fA-F0-9]{40}$/i.test(toAddress) ? recipientAddr : undefined,
    decimalsHint: tokenDecimals,
    staleTimeMs: 20_000,
  });

  const recipientBalanceText = !toAddress || !/^0x[a-fA-F0-9]{40}$/i.test(toAddress) ? '—'
    : recipientBalanceError  ? '—'
    : recipientBalanceLoading ? '…'
    : (recipientBalance ?? '0.0');

  const handleChevronClick = useCallback(() => {
    if (recipientPickerVisible) {
      closePanel(SP_COIN_DISPLAY.SEND_RECIPIENT_SELECT_PANEL, 'SendRecipientPanel:chevron:close');
    } else {
      openPanel(SP_COIN_DISPLAY.SEND_RECIPIENT_SELECT_PANEL, 'SendRecipientPanel:chevron:open');
    }
  }, [recipientPickerVisible, openPanel, closePanel]);

  return (
    <div id="SEND_RECIPIENT_PANEL" className="relative h-[75px]">
      <div title="To Recipient" className="absolute top-5 left-[10px] text-[#94a3b8] text-[14px]">
        To Recipient:
      </div>
      <div className="absolute flex items-center" style={{ top: '12px', right: '20px' }}>
        <AccountSelectDropDown
          recipientAccount={sendRecipientAccount}
          onSelectClick={handleChevronClick}
        />
      </div>
      <div className="absolute bottom-[4px] right-[10px] text-[#94a3b8] text-[14px] flex items-center gap-1">
        Balance: {recipientBalanceText}
      </div>
    </div>
  );
}
