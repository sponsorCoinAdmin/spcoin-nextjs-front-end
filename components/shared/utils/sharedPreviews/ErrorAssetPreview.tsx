// File: components/containers/ErrorAssetPreview.tsx
'use client';

import { useMemo } from 'react';
import { useAssetSelectionContext } from '@/lib/context/ScrollSelectPanels/useAssetSelectionContext';
import BasePreviewWrapper from './BasePreviewWrapper';
import { InputState } from '@/lib/structure/assetSelection';
import { isErrorFSMState } from '@/lib/hooks/inputValidations/FSM_Core/fSMInputStates';

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
  [InputState.PREVIEW_CONTRACT_EXISTS_LOCALLY]: {
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
  const { inputState } = useAssetSelectionContext();
  const visible = isErrorFSMState(inputState);

  const { emoji, text, colorHex } = useMemo(() => {
    const item = emojiMap[inputState];
    return {
      emoji: item?.emoji,
      text: item?.text ?? 'An error occurred.',
      colorHex: item?.colorHex ?? '#5981F3',
    };
  }, [inputState]);

  if (!visible) return null;

  return (
    <div id="ErrorAssetPreview">
      <BasePreviewWrapper show={true}>
        <div className="wrapper">
          {emoji && <span className="emoji">{emoji}</span>}
          <span className="message">{text}</span>
        </div>

        <style jsx>{`
          .wrapper {
            display: flex;
            align-items: center;
            margin-left: 22px;
            gap: 8px;
            color: ${colorHex};
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
