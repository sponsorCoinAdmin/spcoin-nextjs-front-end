// File: components/shared/AssetPreviews/ErrorAssetPreview.tsx

'use client';

import React from 'react';
import { InputState } from '@/lib/structure';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';


interface Props {
  inputState: InputState;
  duplicateMessage?: string;
}

const emojiMap: Partial<Record<InputState, {
  emoji?: string;
  text: string;
  color?: string;
  useLogo?: boolean;
}>> = {
  [InputState.INVALID_ADDRESS_INPUT]: {
    emoji: '❓',
    text: 'Valid address required.',
    color: 'text-red-500',
  },
  [InputState.DUPLICATE_INPUT_ERROR]: {
    text: 'Duplicate input selected.',
    color: 'text-orange-400',
    useLogo: true,
  },
  [InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY]: {
    emoji: '⚠️',
    text: 'Missing local image for asset.',
    color: 'text-orange-400',
  },
  [InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN]: {
    emoji: '❌',
    text: 'Address not found on blockchain.',
    color: 'text-red-500',
  },
};

const duplicateMessage:string = 'ToDo: Duplicate input selected.';

const ErrorAssetPreview: React.FC<Props> = () => {
  const { inputState, setInputState, containerType } = useSharedPanelContext();
  const item = emojiMap[inputState];
  if (!item  || inputState === InputState.EMPTY_INPUT) return null;

  const message =
    inputState === InputState.DUPLICATE_INPUT_ERROR && duplicateMessage
      ? duplicateMessage
      : item.text;

  return (
    <div
      className={`flex items-center h-[170px] bg-[#243056] rounded-[22px] p-2 ${item.color ?? 'text-[#5981F3]'}`}
    >
      {item.emoji && (
        <span className="text-[28px] mr-1.5">{item.emoji}</span>
      )}
      <span className="text-[15px]">{message}</span>
    </div>
  );
};

export default ErrorAssetPreview;
