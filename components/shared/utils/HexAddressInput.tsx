// File: @/components/shared/HexAddressInput.tsx
'use client';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import React, { useEffect } from 'react';

type HexAddressInputProps = {
  inputValue: string;
  onChange: (val: string) => void;
  placeholder: string;
  statusEmoji?: string;
  fullWidth?: boolean;
  fitWidthCh?: number;
};

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ADDRESS_SELECT === 'true';
const debugLog = createDebugLogger('HexAddressInput', DEBUG_ENABLED, LOG_TIME);

export default function HexAddressInput({
  inputValue,
  onChange,
  placeholder,
  statusEmoji,
  fullWidth = true,
  fitWidthCh,
}: HexAddressInputProps) {
  useEffect(() => {
    debugLog.log('HexAddressInput rendered, current value:', inputValue);
  }, [inputValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const contentWidthCh = fitWidthCh ?? Math.max((inputValue || placeholder).length, 8);
  const hasStatusEmoji = !!statusEmoji;

  return (
    <div
      className={`
        bg-[#243056]
        text-[#5981F3]
        ${fullWidth ? 'w-full' : 'w-auto inline-flex'}
        mb-0
        rounded-[22px]
        flex
        items-center
        ${fullWidth ? 'px-3 gap-2' : 'px-2 gap-1'}
      `}
    >
      {hasStatusEmoji && <div className="text-lg">{statusEmoji}</div>}
      <input
        className={`
          bg-transparent
          border-none
          outline-none
          text-white
          text-sm
          ${fullWidth ? 'w-full' : 'w-auto'}
          ${fullWidth ? '' : 'text-center'}
          py-2
        `}
        style={!fullWidth ? { width: `${contentWidthCh}ch` } : undefined}
        autoComplete="off"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleChange}
      />
    </div>
  );
}
