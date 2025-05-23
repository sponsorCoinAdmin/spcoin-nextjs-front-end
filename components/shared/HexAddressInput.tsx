'use client';

import styles from '@/styles/Modal.module.css';
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
    <div className={`${styles.modalElementSelectContainer} flex items-center gap-2`}>
      <div className="text-lg">{statusEmoji}</div>
      <input
        className={`${styles.modalElementInput} w-full`}
        autoComplete="off"
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
