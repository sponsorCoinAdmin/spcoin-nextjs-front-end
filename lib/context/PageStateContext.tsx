// File: lib/context/PageStateContext.tsx

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ExchangePageState = {
  showContext: boolean;
  showWallets: boolean;
  collapsedKeys: string[]; // ReactJson specific
};

export type PageStateTree = {
  test: {
    exchangePage: ExchangePageState;
  };
};

const defaultState: PageStateTree = {
  test: {
    exchangePage: {
      showContext: false,
      showWallets: false,
      collapsedKeys: [],
    },
  },
};

const PageStateContext = createContext<{
  state: PageStateTree;
  setState: React.Dispatch<React.SetStateAction<PageStateTree>>;
}>({
  state: defaultState,
  setState: () => {},
});

export const PageStateProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<PageStateTree>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('PageStateContext');
      return saved ? JSON.parse(saved) : defaultState;
    }
    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem('PageStateContext', JSON.stringify(state));
  }, [state]);

  return (
    <PageStateContext.Provider value={{ state, setState }}>
      {children}
    </PageStateContext.Provider>
  );
};

export const usePageState = () => useContext(PageStateContext);
