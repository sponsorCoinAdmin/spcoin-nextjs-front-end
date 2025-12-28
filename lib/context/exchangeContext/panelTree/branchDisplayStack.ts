import type { SP_COIN_DISPLAY } from '@/lib/structure';
import { panelName } from '@/lib/context/exchangeContext/panelTree/panelTreePersistence';

export type PANEL_TYPE = {
  displayTypeId: SP_COIN_DISPLAY;
  displayTypeName: string;
};

export const buildBranchDisplayStack = (
  ids: SP_COIN_DISPLAY[],
): PANEL_TYPE[] =>
  ids.map((id) => ({
    displayTypeId: id,
    displayTypeName: panelName(Number(id) as any),
  }));
