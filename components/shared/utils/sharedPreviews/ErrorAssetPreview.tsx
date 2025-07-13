'use client';

import React, { useEffect, useState } from 'react';
import { InputState } from '@/lib/structure';
import { useTerminalFSMState } from '@/lib/hooks/inputValidations/useTerminalFSMState';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true';
const debugLog = createDebugLogger('ErrorAssetPreview', DEBUG_ENABLED);

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
  [InputState.VALIDATE_BALANCE_ERROR]: { emoji: '💥', text: 'Balance check failed.', color: 'text-red-500' },
};

export default function ErrorAssetPreview() {
  const { inputState, isTerminalState, isErrorState } = useTerminalFSMState();
  const [showPanel, setShowPanel] = useState(false);

  const debugShowPanel = (value: boolean, reason?: string) => {
    debugLog.log(
      `🧭 debugShowPanel → set to ${value} (inputState=${InputState[inputState]}, isTerminal=${isTerminalState}, isError=${isErrorState}, reason=${reason || 'none'})`
    );
    setShowPanel(value);
  };
console.log('⚡ ErrorAssetPreview re-rendered');
  useEffect(() => {
    const shouldShow = isTerminalState && isErrorState;
    debugShowPanel(shouldShow, 'ErrorAssetPreview visibility check');
  }, [isTerminalState, isErrorState, inputState]);

  if (!showPanel) return null;

  const item = emojiMap[inputState];
  const message = item?.text ?? 'An error occurred.';

  return (
    <div className={`flex items-center h-[170px] bg-[#243056] rounded-[22px] p-2 ${item?.color ?? 'text-[#5981F3]'}`}>
      {item?.emoji && <span className="ml-[22px] text-[28px] mr-1.5">{item.emoji}</span>}
      <span className="text-[15px]">{message}</span>
    </div>
  );
}
