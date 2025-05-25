'use client';

import React from 'react';

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
  return (
    <>
      <style jsx>{`
        .modalElementSelectContainer {
          background-color: #243056;
          color: #5981F3;
          width: 100%;
          margin-bottom: 0px;
          border-radius: 22px !important;
          display: flex;
          align-items: center;
          padding: 0 0.75rem; /* Optional horizontal spacing */
        }
        .modalElementInput {
          background-color: transparent;
          border: none;
          outline: none;
          color: #ffffff;
          font-size: 14px;
          width: 100%;
          padding: 0.5rem 0;
        }
      `}</style>

      <div className="modalElementSelectContainer flex items-center gap-2">
        <div className="text-lg">{statusEmoji}</div>
        <input
          className="modalElementInput w-full"
          autoComplete="off"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </>
  );
}
