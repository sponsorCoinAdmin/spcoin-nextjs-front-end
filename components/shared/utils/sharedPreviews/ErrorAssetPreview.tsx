// File: components/containers/ErrorAssetPreview.tsx
'use client';

import { useEffect, useState } from 'react';
import { InputState } from '@/lib/structure';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';
import {
  isErrorFSMState,
  isTerminalFSMState,
} from '@/lib/hooks/inputValidations/FSM_Core/fSMInputStates';
import BasePreviewWrapper from './BasePreviewWrapper';

const emojiMap: Partial<
  Record<
    InputState,
    {
      emoji?: string;
      text: string;
      colorHex?: string;
    }
  >
> = {
  [InputState.INVALID_HEX_INPUT]: {
    emoji: '⛔',
    text: 'Hex input invalid.',
    colorHex: '#ef4444',
  },
  [InputState.INCOMPLETE_ADDRESS]: {
    emoji: '✏️',
    text: 'Incomplete address.',
    colorHex: '#10a310ff',
  },
  [InputState.INVALID_ADDRESS_INPUT]: {
    emoji: '❓',
    text: 'Valid address required.',
    colorHex: '#ef4444',
  },
  [InputState.DUPLICATE_INPUT_ERROR]: {
    emoji: '♻️',
    text: 'Duplicate input selected.',
    colorHex: '#f97316',
  },
  [InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN]: {
    emoji: '❌',
    text: 'Address not found on blockchain.',
    colorHex: '#ef4444',
  },
  [InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY]: {
    emoji: '📭',
    text: 'Missing local asset preview.',
    colorHex: '#f97316',
  },
  [InputState.RESOLVE_ASSET_ERROR]: {
    emoji: '💥',
    text: 'Validate asset error.',
    colorHex: '#ef4444',
  },
  [InputState.TOKEN_NOT_RESOLVED_ERROR]: {
    emoji: '💥',
    text: 'Token Not Resolved.',
    colorHex: '#ef4444',
  },
  [InputState.MISSING_ACCOUNT_ADDRESS]: {
    emoji: '🚫',
    text: 'Missing account address.',
    colorHex: '#ef4444',
  },
};

export default function ErrorAssetPreview() {
  // Read current FSM state directly from context
  const { inputState } = useSharedPanelContext();

  // Derive terminal/error flags locally (replacing useTerminalFSMState)
  const isTerminalState = isTerminalFSMState(inputState);
  const isErrorState = isErrorFSMState(inputState);

  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    setShowPanel(isTerminalState && isErrorState);
  }, [isTerminalState, isErrorState, inputState]);

  if (!showPanel) return null;

  const item = emojiMap[inputState];
  const message = item?.text ?? 'An error occurred.';
  const color = item?.colorHex ?? '#5981F3';

  return (
    <div id="ErrorAssetPreview">
      <BasePreviewWrapper show={showPanel}>
        <div className="wrapper">
          {item?.emoji && <span className="emoji">{item.emoji}</span>}
          <span className="message">{message}</span>
        </div>

        <style jsx>{`
          .wrapper {
            display: flex;
            align-items: center;
            margin-left: 22px;
            gap: 8px;
            color: ${color};
          }
          .emoji {
            font-size: 28px;
          }
          .message {
            font-size: 15px;
          }
        `}</style>
      </BasePreviewWrapper>
    </div>
  );
}
