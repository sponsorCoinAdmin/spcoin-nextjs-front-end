// File: components/utility/PanelGate.tsx
'use client';

import type { ReactNode } from 'react';
import type { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';

type Props = {
  panel: SP_COIN_DISPLAY;
  children: ReactNode;
};

export default function PanelGate({ panel, children }: Props) {
  const visible = usePanelVisible(panel);
  if (!visible) return null;
  return <>{children}</>;
}
