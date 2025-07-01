// File: lib/context/ScrollSelectPanel/SharedPanelContext.tsx

'use client';

import { createContext, useContext, useMemo } from 'react';
import { InputState, CONTAINER_TYPE, TokenContract } from '@/lib/structure';
import { useBaseSelectShared } from '@/lib/hooks/useBaseSelectShared';

export interface SharedPanelContextType {
  inputState: InputState;
  setInputState: (state: InputState) => void;
  containerType: CONTAINER_TYPE;
  onSelect?: (token: TokenContract, state: InputState) => void;
}

const SharedPanelContext = createContext<SharedPanelContextType | undefined>(undefined);

export const SharedPanelProvider = ({
  children,
  containerType,
  onSelect,
}: {
  children: React.ReactNode;
  containerType: CONTAINER_TYPE;
  onSelect?: (token: TokenContract, state: InputState) => void;
}) => {
  const shared = useBaseSelectShared();

  const value = useMemo(
    () => ({
      inputState: shared.inputState,
      setInputState: shared.setInputState,
      containerType,
      onSelect,
    }),
    [shared.inputState, shared.setInputState, containerType, onSelect]
  );

  return (
    <SharedPanelContext.Provider value={value}>
      {children}
    </SharedPanelContext.Provider>
  );
};

export const useSharedPanelContext = (): SharedPanelContextType => {
  const ctx = useContext(SharedPanelContext);
  if (!ctx) throw new Error('❌ useSharedPanelContext must be used within a SharedPanelProvider');
  return ctx;
};
