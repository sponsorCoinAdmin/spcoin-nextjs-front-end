'use client';

import React from 'react';
import { useWalletActionOverlay } from '@/lib/context/WalletActionOverlayContext';

export default function WalletActionOverlay() {
  const { isOpen, title, message } = useWalletActionOverlay();
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60"
    >
      <div className="w-[min(90vw,32rem)] rounded-lg border border-red-500 bg-[#1A1D2E] p-6 text-white shadow-2xl">
        <h2 className="text-xl font-bold text-[#EBCA6A]">{title}</h2>
        <p className="mt-2 text-sm text-slate-200">{message}</p>
      </div>
    </div>
  );
}

