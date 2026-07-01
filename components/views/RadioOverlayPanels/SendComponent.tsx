'use client';

import { useState, useCallback } from 'react';
import { parseUnits } from 'viem';
import type { Address } from 'viem';
import { useQueryClient } from '@tanstack/react-query';
import { useSendTokenContract } from '@/lib/context/hooks';
import { useNativeToken } from '@/lib/hooks/useNativeToken';
import { useExchangeContext } from '@/lib/context/hooks';
import { useGetBalance } from '@/lib/hooks/useGetBalance';
import { useHardhatAwareTransfer } from '@/lib/hooks/useHardhatAwareTransfer';
import SendSelectPanel from './SendSelectPanel';
import SendRecipientPanel from './SendRecipientPanel';
import SendButton from '@/components/views/Buttons/SendButton';
import PanelGate from '@/components/utility/PanelGate';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import TxReceiptModal from '@/components/modals/TxReceiptModal';
import type { TxReceipt } from '@/components/modals/TxReceiptModal';

export default function SendComponent() {
  const [sendTokenContract] = useSendTokenContract();
  const nativeToken = useNativeToken();
  const { exchangeContext } = useExchangeContext();

  const [amount, setAmount] = useState('0');
  const [isPending, setIsPending] = useState(false);
  const [txReceipt, setTxReceipt] = useState<TxReceipt | null>(null);

  const token = sendTokenContract ?? nativeToken;
  const tokenSymbol = token?.symbol ?? 'TOKEN';
  const tokenAddr = token?.address as Address | undefined;
  const tokenDecimals = token?.decimals ?? 18;
  const toAddress = exchangeContext.accounts?.sendRecipientAddress ?? '';
  const activeAccountAddr = exchangeContext.accounts?.activeAccount?.address as Address | undefined;

  const { formatted: formattedBalance, isLoading: balanceLoading, error: balanceError } = useGetBalance({
    tokenAddress: tokenAddr,
    userAddress: activeAccountAddr,
    decimalsHint: tokenDecimals,
    staleTimeMs: 20_000,
  });

  const balanceText = !tokenAddr        ? '—'
    : !activeAccountAddr                ? '—'
    : balanceError                      ? '—'
    : balanceLoading                    ? '…'
    : (formattedBalance ?? '0.0');

  const tokenBalance = parseFloat(formattedBalance ?? '0');

  const { transfer, sendNative } = useHardhatAwareTransfer();
  const queryClient = useQueryClient();

  const handleSend = useCallback(async () => {
    if (!toAddress) return;
    const decimals = token?.decimals ?? 18;
    const amountBigInt = parseUnits(amount.trim(), decimals);
    setIsPending(true);
    try {
      let txHash: string | undefined;
      if (tokenAddr) {
        const result = await transfer(tokenAddr, toAddress as Address, amountBigInt);
        txHash = typeof result === 'string' ? result : String(result ?? '');
      } else {
        txHash = await sendNative(toAddress as Address, amountBigInt);
      }
      if (txHash) {
        void queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey[0];
            return typeof key === 'string' && key.startsWith('balance:');
          },
        });
        setTxReceipt({
          txHash,
          from: activeAccountAddr ?? '',
          to: toAddress,
          amount: amount.trim(),
          tokenSymbol,
        });
      }
    } catch (err) {
      console.error('SendComponent: transfer failed', err);
    } finally {
      setIsPending(false);
    }
  }, [toAddress, token, amount, tokenAddr, tokenSymbol, activeAccountAddr, transfer, sendNative]);

  return (
    <>
    <TxReceiptModal
      isOpen={txReceipt !== null}
      receipt={txReceipt}
      onClose={() => setTxReceipt(null)}
    />
    <div className="flex flex-1 flex-col gap-1">
      <PanelGate panel={SP_COIN_DISPLAY.SEND_SELECT_PANEL}>
        <div className="rounded-[12px] overflow-hidden bg-[#1f2639]">
          <SendSelectPanel
            token={token}
            balanceText={balanceText}
            amount={amount}
            onAmountChange={setAmount}
          />
        </div>
      </PanelGate>
      <PanelGate panel={SP_COIN_DISPLAY.SEND_ADDRESS_HEADER_BAR}>
        <div className="rounded-[12px] overflow-hidden bg-[#1f2639]">
          <SendRecipientPanel />
        </div>
      </PanelGate>

      <PanelGate panel={SP_COIN_DISPLAY.SEND_BUTTON}>
        <SendButton
          amount={amount}
          toAddress={toAddress}
          tokenBalance={tokenBalance}
          tokenSymbol={tokenSymbol}
          isPending={isPending}
          onSend={handleSend}
        />
      </PanelGate>
    </div>
    </>
  );
}
