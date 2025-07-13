'use client';

import React from 'react';
import { InputState } from '@/lib/structure';
import { useTerminalFSMState } from '@/lib/hooks/inputValidations/useTerminalFSMState';

const emojiMap: Partial<Record<InputState, {
  emoji?: string;
  text: string;
  color?: string;
}>> = {
  [InputState.INVALID_HEX_INPUT]: {
    emoji: '⚠️',
    text: 'Invalid address format.',
    color: 'text-red-500',
  },
  [InputState.INCOMPLETE_ADDRESS]: {
    emoji: '✏️',
    text: 'Incomplete address.',
    color: 'text-orange-400',
  },
  [InputState.INVALID_ADDRESS_INPUT]: {
    emoji: '❓',
    text: 'Valid address required.',
    color: 'text-red-500',
  },
  [InputState.DUPLICATE_INPUT_ERROR]: {
    emoji: '♻️',
    text: 'Duplicate input selected.',
    color: 'text-orange-400',
  },
  [InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN]: {
    emoji: '❌',
    text: 'Address not found on blockchain.',
    color: 'text-red-500',
  },
  [InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY]: {
    emoji: '📭',
    text: 'Missing local asset preview.',
    color: 'text-orange-400',
  },
  [InputState.VALIDATE_BALANCE_ERROR]: {
    emoji: '💥',
    text: 'Balance check failed.',
    color: 'text-red-500',
  },
};

const ErrorAssetPreview: React.FC = () => {
  const { inputState, isTerminalState, isErrorState } = useTerminalFSMState();

  if (!isTerminalState || !isErrorState) return null;

  const item = emojiMap[inputState];
  const message = item?.text ?? 'An error occurred.';

  return (
    <div
      className={`flex items-center h-[170px] bg-[#243056] rounded-[22px] p-2 ${item?.color ?? 'text-[#5981F3]'}`}
    >
      {item?.emoji && (
        <span className="ml-[22px] text-[28px] mr-1.5">
          {item.emoji}
        </span>
      )}
      <span className="text-[15px]">{message}</span>
    </div>
  );
};

export default ErrorAssetPreview;
