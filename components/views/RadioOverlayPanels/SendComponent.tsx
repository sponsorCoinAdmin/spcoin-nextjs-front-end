'use client';

import { useState } from 'react';
import { useBuyTokenContract } from '@/lib/context/hooks/ExchangeContext/tokens';
import { useNativeToken } from '@/lib/hooks/useNativeToken';
import SendSelectPanel from './SendSelectPanel';
import TokenAddressComponent from '@/components/views/Headers/TokenAddressComponent';

import SendTitle from '@/components/views/Headers/SendTitle';
import PanelGate from '@/components/utility/PanelGate';
import { SP_COIN_DISPLAY } from '@/lib/structure';

export default function SendComponent() {
  const [buyTokenContract] = useBuyTokenContract();
  const nativeToken = useNativeToken();

  const [amount, setAmount] = useState('0');

  const token = buyTokenContract ?? nativeToken;
  const tokenSymbol = token?.symbol ?? 'TOKEN';

  const canSend = parseFloat(amount) > 0;

  const handleSend = () => {
    if (!canSend) return;
    // TODO: wire up transfer call (native or ERC20)
    console.log('SendComponent: transfer', {
      symbol: tokenSymbol,
      amount: amount.trim(),
    });
  };

  return (
    <div className="flex flex-1 flex-col">
      <SendTitle />
      <TokenAddressComponent />
      <PanelGate panel={SP_COIN_DISPLAY.SEND_SELECT_PANEL}>
        <SendSelectPanel amount={amount} onAmountChange={setAmount} />
      </PanelGate>
      <div className="flex flex-col gap-3 px-4 pt-3 pb-4">
        <button
          type="button"
          className="h-[36px] w-full rounded px-4 py-[0.28rem] text-center font-bold text-black transition-colors bg-[#E5B94F] hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSend}
          disabled={!canSend}
        >
          Send
        </button>
      </div>
    </div>
  );
}
