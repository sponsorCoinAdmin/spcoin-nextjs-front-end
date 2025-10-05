// File: app/(menu)/Test/Tabs/ExchangeContext/structure/types/virtualPanel.ts

import { SP_COIN_DISPLAY as SPCD } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';

export type VirtualPanelNode = {
  id: SPCD;                  // enum id
  name: string;              // SP[id] (human label)
  visible: boolean;          // source of truth for expand/collapse
  children: VirtualPanelNode[];
};
