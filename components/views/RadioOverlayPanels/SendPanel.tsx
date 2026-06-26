'use client';

import PanelGate from '@/components/utility/PanelGate';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import SendComponent from './SendComponent';

export default function SendPanel() {
  return (
    <PanelGate panel={SP_COIN_DISPLAY.SEND_PANEL} className="min-h-0 flex-1" lazyLoad={false}>
      <SendComponent />
    </PanelGate>
  );
}
