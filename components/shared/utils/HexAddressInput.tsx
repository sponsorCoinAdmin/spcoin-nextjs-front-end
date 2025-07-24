// File: components/shared/HexAddressInput.tsx

'use client';

import React, { useEffect } from 'react';

type HexAddressInputProps = {
  inputValue: string;
  onChange: (val: string) => void;
  placeholder: string;
  statusEmoji?: string;
};

export default function HexAddressInput({
  inputValue,
  onChange,
  placeholder,
  statusEmoji,
}: HexAddressInputProps) {
  useEffect(() => {
    console.log('⚡ HexAddressInput rendered, current value:', inputValue);
  }, [inputValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // console.log('✏️ [HexAddressInput]: HexAddressInput onChange fired with value:', e.target.value);
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
