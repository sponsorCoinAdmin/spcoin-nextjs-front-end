// File: components/views/Headers/MenuTabHeaderBar.tsx
'use client';

import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import AccountPanelTabBar from '@/components/views/RadioOverlayPanels/AccountPanel/AccountPanelTabBar';

export default function MenuTabHeaderBar() {
  const open = usePanelVisible(SP_COIN_DISPLAY.MENU_TAB_HEADER_BAR);
  return <AccountPanelTabBar open={open} />;
}
