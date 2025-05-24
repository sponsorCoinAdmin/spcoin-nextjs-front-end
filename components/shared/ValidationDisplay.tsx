// File: components/shared/ValidationDisplay.tsx

import React from 'react';
import { InputState } from '@/lib/structure/types';

interface Props {
  inputState: InputState;
  duplicateMessage?: string;
}

const emojiMap: Partial<Record<InputState, { emoji?: string; text: string; color?: string; useAvatar?: boolean }>> = {
  [InputState.INVALID_ADDRESS_INPUT]: {
    emoji: '❓',
    text: 'Valid address required.',
    color: 'red'
  },
  [InputState.DUPLICATE_INPUT]: {
    text: 'Duplicate input selected.',
    color: 'orange',
    useAvatar: true
  },
  [InputState.CONTRACT_NOT_FOUND_LOCALLY]: {
    emoji: '⚠️',
    text: 'Missing local image for token.',
    color: 'orange'
  },
  [InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN]: {
    emoji: '❌',
    text: 'Address not found on blockchain.',
    color: 'red'
  }
};

const ValidationDisplay: React.FC<Props> = ({ inputState, duplicateMessage }) => {
  const item = emojiMap[inputState];
  if (!item) return null;

  const message = inputState === InputState.DUPLICATE_INPUT && duplicateMessage
    ? duplicateMessage
    : item.text;

  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        color: item.color || 'red',
        marginLeft: item.useAvatar ? '1.4rem' : 0
      }}
    >
      {item.emoji && <span style={{ fontSize: 28, marginRight: 6 }}>{item.emoji}</span>}
      <span style={{ fontSize: '15px' }}>{message}</span>
    </span>
  );
};

export default ValidationDisplay;
