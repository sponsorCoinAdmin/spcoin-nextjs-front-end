import { useTerminalFSMState } from '@/lib/hooks/inputValidations/useTerminalFSMState';
import BasePreviewWrapper from './BasePreviewWrapper';
import { useEffect, useState } from 'react';
import { InputState } from '@/lib/structure';

const emojiMap: Partial<Record<InputState, {
  emoji?: string;
  text: string;
  color?: string;
}>> = {
  [InputState.INVALID_HEX_INPUT]: { emoji: '⚠️', text: 'Invalid address format.', color: 'text-red-500' },
  [InputState.INCOMPLETE_ADDRESS]: { emoji: '✏️', text: 'Incomplete address.', color: 'text-orange-400' },
  [InputState.INVALID_ADDRESS_INPUT]: { emoji: '❓', text: 'Valid address required.', color: 'text-red-500' },
  [InputState.DUPLICATE_INPUT_ERROR]: { emoji: '♻️', text: 'Duplicate input selected.', color: 'text-orange-400' },
  [InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN]: { emoji: '❌', text: 'Address not found on blockchain.', color: 'text-red-500' },
  [InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY]: { emoji: '📭', text: 'Missing local asset preview.', color: 'text-orange-400' },
  [InputState.VALIDATE_ASSET_ERROR]: { emoji: '💥', text: 'Validate asset error.', color: 'text-red-500' },
  [InputState.MISSING_ACCOUNT_ADDRESS]: { emoji: '🚫', text: 'Missing account address.', color: 'text-red-500' },
};

export default function ErrorAssetPreview() {
  const { inputState, isTerminalState, isErrorState } = useTerminalFSMState();
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    setShowPanel(isTerminalState && isErrorState);
  }, [isTerminalState, isErrorState, inputState]);

  if (!showPanel) return null; // optional, but BasePreviewWrapper handles it

  const item = emojiMap[inputState];
  const message = item?.text ?? 'An error occurred.';

  return (
    <div id="ErrorAssetPreview">
      <BasePreviewWrapper show={showPanel}>
        {item?.emoji && <span className="ml-[22px] text-[28px] mr-1.5">{item.emoji}</span>}
        <span className={`text-[15px] ${item?.color ?? 'text-[#5981F3]'}`}>{message}</span>
      </BasePreviewWrapper>
    </div>
  );
}
