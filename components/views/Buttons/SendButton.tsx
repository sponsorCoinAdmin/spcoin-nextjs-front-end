'use client';

import { useMemo } from 'react';
import ActionButton from './ActionButton';

type Props = {
  amount: string;
  toAddress: string;
  tokenBalance: number;
  tokenSymbol: string;
  isPending?: boolean;
  onSend: () => void;
};

export default function SendButton({ amount, toAddress, tokenBalance, tokenSymbol, isPending, onSend }: Props) {
  const hasAmount = parseFloat(amount) > 0;
  const hasRecipient = toAddress.length > 0;
  const isInsufficient = hasAmount && parseFloat(amount) > tokenBalance;
  const canSend = hasAmount && hasRecipient && !isInsufficient;

  const buttonText = useMemo(() => {
    if (isPending) return 'Sending…';
    if (isInsufficient) return `Insufficient ${tokenSymbol} Balance`;
    if (!hasRecipient && !hasAmount) return 'Enter Amount & Select Recipient';
    if (!hasRecipient) return 'Select Recipient';
    if (!hasAmount) return 'Enter Amount';
    return 'Send';
  }, [isPending, hasAmount, hasRecipient, isInsufficient, tokenSymbol]);

  if (isPending) {
    return (
      <div className="p-0 m-0">
        <button
          id="SendButton"
          type="button"
          disabled
          className="flex items-center justify-center text-white bg-orange-600 w-full h-[55px] text-[20px] font-bold rounded-[12px] cursor-not-allowed opacity-90 animate-pulse"
        >
          {buttonText}
        </button>
      </div>
    );
  }

  const bgClass: 'bg-[#243056]' | 'bg-[#501505]' | 'bg-[#1f3e1d]' = isInsufficient
    ? 'bg-[#501505]'
    : canSend
    ? 'bg-[#1f3e1d]'
    : 'bg-[#243056]';

  return (
    <ActionButton
      id="SendButton"
      text={buttonText}
      bgClass={bgClass}
      onClick={canSend ? onSend : undefined}
    />
  );
}
