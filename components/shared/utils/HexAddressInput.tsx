// File: components/shared/HexAddressInput.tsx

'use client';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import React, { useEffect } from 'react';

type HexAddressInputProps = {
  inputValue: string;
  onChange: (val: string) => void;
  placeholder: string;
  statusEmoji?: string;
};

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ADDRESS_SELECT === 'true';
const debugLog = createDebugLogger('HexAddressInput', DEBUG_ENABLED, LOG_TIME);

export default function HexAddressInput({
  inputValue,
  onChange,
  placeholder,
  statusEmoji,
}: HexAddressInputProps) {
  useEffect(() => {
    debugLog.log('⚡ HexAddressInput rendered, current value:', inputValue);
  }, [inputValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // debugLog.log('✏️ [HexAddressInput]: HexAddressInput onChange fired with value:', e.target.value);
    onChange(e.target.value);
  };

  return (
    <div
      className={`
        bg-[#243056]
        text-[#5981F3]
        w-full
        mb-0
        rounded-[22px]
        flex
        items-center
        px-3
        gap-2
      `}
    >
      <div className="text-lg">{statusEmoji}</div>
      <input
        className={`
          bg-transparent
          border-none
          outline-none
          text-white
          text-sm
          w-full
          py-2
        `}
        autoComplete="off"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleChange}
      />
    </div>
  );
}
