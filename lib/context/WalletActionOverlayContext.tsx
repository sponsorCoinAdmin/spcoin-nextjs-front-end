'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';

type WalletActionOverlayContextValue = {
  isOpen: boolean;
  title: string;
  message: string;
  beginWalletAction: (title?: string, message?: string) => void;
  endWalletAction: () => void;
  runWithWalletAction: <T>(
    action: () => Promise<T>,
    title?: string,
    message?: string,
  ) => Promise<T>;
};

const DEFAULT_TITLE = 'MetaMask action in progress';
const DEFAULT_MESSAGE = 'Complete the request in MetaMask to continue.';

const WalletActionOverlayContext =
  createContext<WalletActionOverlayContextValue | null>(null);

export function WalletActionOverlayProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  const beginWalletAction = (nextTitle?: string, nextMessage?: string) => {
    setTitle(nextTitle || DEFAULT_TITLE);
    setMessage(nextMessage || DEFAULT_MESSAGE);
    setIsOpen(true);
  };

  const endWalletAction = () => {
    setIsOpen(false);
  };

  const runWithWalletAction = async <T,>(
    action: () => Promise<T>,
    nextTitle?: string,
    nextMessage?: string,
  ): Promise<T> => {
    beginWalletAction(nextTitle, nextMessage);
    try {
      return await action();
    } finally {
      endWalletAction();
    }
  };

  const value = useMemo<WalletActionOverlayContextValue>(
    () => ({
      isOpen,
      title,
      message,
      beginWalletAction,
      endWalletAction,
      runWithWalletAction,
    }),
    [isOpen, title, message],
  );

  return (
    <WalletActionOverlayContext.Provider value={value}>
      {children}
    </WalletActionOverlayContext.Provider>
  );
}

export function useWalletActionOverlay() {
  const ctx = useContext(WalletActionOverlayContext);
  if (!ctx) {
    throw new Error(
      'useWalletActionOverlay must be used within WalletActionOverlayProvider',
    );
  }
  return ctx;
}

