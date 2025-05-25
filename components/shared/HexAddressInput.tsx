'use client';

import React from 'react';

// ✅ Grouped styles under `hexInput`
const hexInput = {
  containerStyle: {
    backgroundColor: '#243056',
    color: '#5981F3',
    width: '100%',
    marginBottom: '0px',
    borderRadius: '22px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 0.75rem',
    gap: '0.5rem',
  } as React.CSSProperties,

  inputStyle: {
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#ffffff',
    fontSize: '14px',
    width: '100%',
    padding: '0.5rem 0',
  } as React.CSSProperties,
};

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
    <div style={hexInput.containerStyle}>
      <div className="text-lg">{statusEmoji}</div>
      <input
        style={hexInput.inputStyle}
        autoComplete="off"
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
