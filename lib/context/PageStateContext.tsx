'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ExchangePageState {
  showContext?: boolean;
  showWallets?: boolean;
  collapsedKeys?: string[];
  expandContext?: boolean;
}

export type PageStateTree = {
  page: {
    exchangePage: ExchangePageState;
  };
};

const defaultState: PageStateTree = {
  page: {
    exchangePage: {
      showContext: false,
      showWallets: false,
      collapsedKeys: [],
      expandContext: false,
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
      return saved ? (JSON.parse(saved) as PageStateTree) : defaultState;
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
