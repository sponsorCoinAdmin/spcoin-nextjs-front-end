// File: components/shared/AssetPreviews/ValidateAssetPreview.tsx

'use client';

import React from 'react';
import { InputState } from '@/lib/structure/types';

interface Props {
  inputState: InputState;
  duplicateMessage?: string;
}

const emojiMap: Partial<Record<InputState, {
  emoji?: string;
  text: string;
  color?: string;
  useAvatar?: boolean;
}>> = {
  [InputState.INVALID_ADDRESS_INPUT]: {
    emoji: '❓',
    text: 'Valid address required.',
    color: 'red',
  },
  [InputState.DUPLICATE_INPUT]: {
    text: 'Duplicate input selected.',
    color: 'orange',
    useAvatar: true,
  },
  [InputState.CONTRACT_NOT_FOUND_LOCALLY]: {
    emoji: '⚠️',
    text: 'Missing local image for asset.',
    color: 'orange',
  },
  [InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN]: {
    emoji: '❌',
    text: 'Address not found on blockchain.',
    color: 'red',
  },
};

const ValidateAssetPreview: React.FC<Props> = ({ inputState, duplicateMessage }) => {
  const item = emojiMap[inputState];
  if (!item || inputState === InputState.VALID_INPUT_PENDING || inputState === InputState.EMPTY_INPUT) return null;

  const message =
    inputState === InputState.DUPLICATE_INPUT && duplicateMessage
      ? duplicateMessage
      : item.text;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '170px',
        backgroundColor: '#243056',
        color: item.color || '#5981F3',
        padding: '8px',
        borderRadius: '22px',
      }}
    >
      {item.emoji && (
        <span style={{ fontSize: 28, marginRight: 6 }}>{item.emoji}</span>
      )}
      <span style={{ fontSize: '15px' }}>{message}</span>
    </div>
  );
};

export default ValidateAssetPreview;
