'use client';

import { useState } from 'react';
import type { Address } from 'viem';
import { useSendTokenContract } from '@/lib/context/hooks';
import { useNativeToken } from '@/lib/hooks/useNativeToken';
import { useExchangeContext } from '@/lib/context/hooks';
import { useGetBalance } from '@/lib/hooks/useGetBalance';
import SendSelectPanel from './SendSelectPanel';
import SendRecipientPanel from './SendRecipientPanel';
import SendButton from '@/components/views/Buttons/SendButton';
import PanelGate from '@/components/utility/PanelGate';
import { SP_COIN_DISPLAY } from '@/lib/structure';

export default function SendComponent() {
  const [sendTokenContract] = useSendTokenContract();
  const nativeToken = useNativeToken();
  const { exchangeContext } = useExchangeContext();

  const [amount, setAmount] = useState('0');

  const token = sendTokenContract ?? nativeToken;
  const tokenSymbol = token?.symbol ?? 'TOKEN';
  const tokenAddr = token?.address as Address | undefined;
  const tokenDecimals = token?.decimals ?? 18;
  const toAddress = exchangeContext.accounts?.sendRecipientAddress ?? '';
  const activeAccountAddr = exchangeContext.accounts?.activeAccount?.address as Address | undefined;

  const { formatted: formattedBalance } = useGetBalance({
    tokenAddress: tokenAddr,
    userAddress: activeAccountAddr,
    decimalsHint: tokenDecimals,
    staleTimeMs: 20_000,
  });

  const tokenBalance = parseFloat(formattedBalance ?? '0');

  const handleSend = () => {
    console.log('SendComponent: transfer', {
      symbol: tokenSymbol,
      amount: amount.trim(),
      to: toAddress,
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-1">
      <PanelGate panel={SP_COIN_DISPLAY.SEND_SELECT_PANEL}>
        <div className="rounded-[12px] overflow-hidden bg-[#1f2639]">
          <SendSelectPanel amount={amount} onAmountChange={setAmount} />
        </div>
      </PanelGate>
<PanelGate panel={SP_COIN_DISPLAY.SEND_ADDRESS_HEADER_BAR}>
        <div className="rounded-[12px] overflow-hidden bg-[#1f2639]">
          <SendRecipientPanel />
        </div>
      </PanelGate>
      <SendButton
        amount={amount}
        toAddress={toAddress}
        tokenBalance={tokenBalance}
        tokenSymbol={tokenSymbol}
        onSend={handleSend}
      />
    </div>
  );
}
