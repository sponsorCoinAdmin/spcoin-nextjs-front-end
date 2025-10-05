// File: components/utility/PanelGate.tsx
'use client';

import { ReactNode } from 'react';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { SP_COIN_DISPLAY } from '@/lib/structure';

type Props = {
  panel: SP_COIN_DISPLAY;
  children: ReactNode;
};

export default function PanelGate({ panel, children }: Props) {
  const { isVisible } = usePanelTree();
  if (!isVisible(panel)) return null;
  return <>{children}</>;
}
