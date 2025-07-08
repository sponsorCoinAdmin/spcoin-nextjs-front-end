// File: components/shared/AssetPreviews/ValidateAssetPreview.tsx

'use client';

import React from 'react';
import { InputState } from '@/lib/structure';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/SharedPanelContext';
  const { inputState, setInputState, containerType } = useSharedPanelContext();


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
  [InputState.DUPLICATE_INPUT]: {
    text: 'Duplicate input selected.',
    color: 'text-orange-400',
    useLogo: true,
  },
  [InputState.CONTRACT_NOT_FOUND_LOCALLY]: {
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

const ValidateAssetPreview: React.FC<Props> = () => {
  const item = emojiMap[inputState];
  if (!item || inputState === InputState.IS_LOADING || inputState === InputState.EMPTY_INPUT) return null;

  const message =
    inputState === InputState.DUPLICATE_INPUT && duplicateMessage
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

export default ValidateAssetPreview;
