// File: @/components/shared/utils/sharedPreviews/ErrorAssetPreview.tsx
'use client';

import { useMemo, useEffect } from 'react';
import { useAssetSelectContext } from '@/lib/context/AssetSelectPanels/useAssetSelectContext';
import BasePreviewWrapper from './BasePreviewWrapper';
import { InputState } from '@/lib/structure/assetSelection';
import { isErrorFSMState } from '@/lib/hooks/inputValidations/FSM_Core/fSMInputStates';
import { badTokenAddressImage } from '@/lib/context/helpers/assetHelpers';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true';
const debugLog = createDebugLogger('ErrorAssetPreview', DEBUG_ENABLED, LOG_TIME);

export default function ErrorAssetPreview() {
  const { inputState, instanceId, containerType, feedType } = useAssetSelectContext();

  const stateName = InputState[inputState];
  const visible = isErrorFSMState(inputState);

  useEffect(() => {
    debugLog.log?.('[ErrorAssetPreview] RENDER', {
      instanceId,
      containerType,
      feedType,
      inputState,
      stateName,
      visible,
    });
  }, [instanceId, containerType, feedType, inputState, stateName, visible]);

  const { emoji, imageSrc, text, colorHex } = useMemo(() => {
    const map: Partial<
      Record<
        InputState,
        {
          emoji?: string;
          imageSrc?: string;
          text: string;
          colorHex?: string;
        }
      >
    > = {
      // Use image (like RenderAssetPreview) for these error states
      [InputState.INVALID_HEX_INPUT]: {
        imageSrc: badTokenAddressImage,
        text: 'Hex input invalid.',
        colorHex: '#ef4444',
      },
      [InputState.INVALID_ADDRESS_INPUT]: {
        imageSrc: badTokenAddressImage,
        text: 'Valid address required.',
        colorHex: '#ef4444',
      },
      [InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN]: {
        imageSrc: badTokenAddressImage,
        text: 'Address not found on blockchain.',
        colorHex: '#ef4444',
      },
       // Keep emoji for the rest
      [InputState.INCOMPLETE_ADDRESS]: {
        emoji: '✏️',
        text: 'Incomplete address.',
        colorHex: '#10a310ff',
      },
      [InputState.DUPLICATE_INPUT_ERROR]: {
        emoji: '♻️',
        text: 'Duplicate input selected.',
        colorHex: '#f97316',
      },
      [InputState.VALIDATE_LOCAL_NATIVE_TOKEN]: {
        emoji: '📭',
        text: 'Missing local asset preview.',
        colorHex: '#f97316',
      },
      [InputState.VALIDATE_ERC20_ASSET_ERROR]: {
        emoji: '💥',
        text: 'Validate asset error.',
        colorHex: '#ef4444',
      },
      [InputState.MISSING_ACCOUNT_ADDRESS]: {
        emoji: '🚫',
        text: 'Missing account address.',
        colorHex: '#ef4444',
      },
    };

    const item = map[inputState];
    return {
      emoji: item?.emoji,
      imageSrc: item?.imageSrc,
      text: item?.text ?? 'An error occurred.',
      colorHex: item?.colorHex ?? '#5981F3',
    };
  }, [inputState]);

  if (!visible) return null;

  return (
    <div
      id='ErrorAssetPreview'
      data-instance={instanceId}
      data-input-state={inputState}
      data-input-state-name={stateName}
    >
      <BasePreviewWrapper show={true}>
        <div className='wrapper'>
          {imageSrc ? (
            <img
              className='logo'
              src={imageSrc}
              alt='Invalid token address'
              loading='lazy'
              decoding='async'
            />
          ) : (
            emoji && <span className='emoji'>{emoji}</span>
          )}
          <span className='message'>{text}</span>
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
          /* Match BasePreviewCard logo size (RenderAssetPreview) */
          .logo {
            width: 42px;
            height: 42px;
            object-fit: contain;
            border-radius: 6px;
            flex-shrink: 0;
          }
          .message {
            font-size: 15px;
          }
        `}</style>
      </BasePreviewWrapper>
    </div>
  );
}
