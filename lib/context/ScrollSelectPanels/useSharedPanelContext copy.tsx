// File: lib/context/ScrollSelectPanels/useSharedPanelContext.tsx

'use client';

import React, { createContext, useContext, useState } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { InputState, CONTAINER_TYPE, FEED_TYPE } from '@/lib/structure';
import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';

// ─── Slice Interfaces ────────────────────────────────────────────────────────────
interface FSMContextType {
  inputState: InputState;
  setInputState: (state: InputState) => void;
  validatedAsset?: ValidatedAsset;
  setValidatedAsset: (asset: ValidatedAsset | undefined) => void;
  containerType: CONTAINER_TYPE;
  feedType: FEED_TYPE;
  dumpFSMContext: () => void;
}

interface FeedContextType {
  validHexInput: string;
  failedHexInput?: string;
  isValidHexInput: (raw: string) => boolean;
  debouncedHexInput: string;
  dumpInputFeedContext: () => void;
}

// ─── Combined Context Type ───────────────────────────────────────────────────────
export type SharedPanelContext = FSMContextType & FeedContextType;

// ─── Context & Hook ─────────────────────────────────────────────────────────────
const SharedPanelContext = createContext<SharedPanelContextType | undefined>(undefined);

export const useSharedPanelContext = (): SharedPanelContextType => {
  const ctx = useContext(SharedPanelContext);
  if (!ctx) throw new Error('useSharedPanelContext must be used within SharedPanelProvider');
  return ctx;
};

// ─── Provider ───────────────────────────────────────────────────────────────────
export function SharedPanelProvider({
  children,
  containerType,
  feedType,
}: {
  children: React.ReactNode;
  containerType: CONTAINER_TYPE;
  feedType: FEED_TYPE;
}) {
  // FSM slice
  const [inputState, setInputState] = useState<InputState>(InputState.EMPTY_INPUT);
  const [validatedAsset, setValidatedAsset] = useState<ValidatedAsset | undefined>(undefined);

  // Feed slice
  const [validHexInput, setValidHexInput] = useState<string>('');
  const [failedHexInput, setFailedHexInput] = useState<string | undefined>(undefined);
  const isValidHexInput = (raw: string) => /^[0-9a-fA-F]*$/.test(raw);
  const debouncedHexInput = useDebounce(validHexInput, 250);

  // Dump functions
  const dumpFSMContext = () => {
    console.group('[FSM Context]');
    console.log({ inputState, validatedAsset, containerType, feedType });
    console.groupEnd();
  };

  const dumpInputFeedContext = () => {
    console.group('[InputFeed Context]');
    console.log({ validHexInput, failedHexInput, debouncedHexInput });
    console.groupEnd();
  };

  const value: SharedPanelContextType = {
    // FSM
    inputState,
    setInputState,
    validatedAsset,
    setValidatedAsset,
    containerType,
    feedType,
    dumpFSMContext,
    // Feed
    validHexInput,
    failedHexInput,
    isValidHexInput,
    debouncedHexInput,
    dumpInputFeedContext,
  };

  return (
    <SharedPanelContext.Provider value={value}>
      {children}
    </SharedPanelContext.Provider>
  );
}
