// File: lib/context/exchangeContext/providers/PanelTreeProvider.tsx
// (or wherever you apply openPanel/closePanel mutations)

import { SP_COIN_DISPLAY } from '@/lib/structure';
import { markPanelApply } from '@/lib/debug/panels/panelVisibilityProbe';

// ... your state and reducer ...

function setVisible(panel: SP_COIN_DISPLAY, visible: boolean, reason?: string) {
  setState(prev => {
    const next = /* mutate or clone to set panel.visible = visible */;
    // ← Instrument the actual apply point:
    markPanelApply(panel, SP_COIN_DISPLAY[panel], visible, reason);
    return next;
  });
}

// Example usages in your existing handlers:
const openPanel = (p: SP_COIN_DISPLAY, reason?: string) => setVisible(p, true, reason);
const closePanel = (p: SP_COIN_DISPLAY, reason?: string) => setVisible(p, false, reason);

// If you have a hydration restore or radio-group restore effect, tag them:
useEffect(() => {
  // when restoring from localStorage:
  // for each panel p with persisted visible v:
  setVisible(p, v, 'hydration-restore');
}, []);

// when enforcing radio-group (open one, close others):
function enforceRadioGroup(opened: SP_COIN_DISPLAY) {
  // close other members:
  for (const other of RADIO_GROUP) {
    if (other !== opened) closePanel(other, 'radio-enforce');
  }
}
