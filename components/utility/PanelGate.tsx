// File: components/utility/PanelGate.tsx
'use client';

import { ReactNode } from 'react';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';

type Props = {
  panel: SP_COIN_DISPLAY;
  children: ReactNode;
};

export default function PanelGate({ panel, children }: Props) {
  // Subscribe narrowly to just this panel's visibility
  const visible = usePanelVisible(panel);
  if (!visible) return null;
  return <>{children}</>;
}
