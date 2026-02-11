// File: @/lib/panels/panelConfig.ts
import { SP_COIN_DISPLAY as SP } from '@/lib/structure';

export type PanelKind = 'root' | 'panel' | 'list' | 'button' | 'control';
export type GroupId = 'mainOverlay';

export type PanelDef = Readonly<{
  id: SP;
  kind: PanelKind;
  defaultVisible: boolean;
  /** Parent in the debug/virtual tree (purely structural, not persisted) */
  parent?: SP;
  /** Radio-group membership (exclusivity handled by the store in Phase 2) */
  group?: GroupId;
  /** Optional UI label override (defaults to enum name) */
  label?: string;
}>;

const MAIN_PARENT = SP.TRADE_CONTAINER_HEADER;
const MAIN_GROUP: GroupId = 'mainOverlay';

// Small builders to reduce repetition
const root = (id: SP, defaultVisible = true, label?: string): PanelDef => ({
  id,
  kind: 'root',
  defaultVisible,
  ...(label ? { label } : null),
});

const child = (
  id: SP,
  kind: Exclude<PanelKind, 'root'>,
  parent: SP,
  defaultVisible: boolean,
  label?: string,
): PanelDef => ({
  id,
  kind,
  parent,
  defaultVisible,
  ...(label ? { label } : null),
});

const overlay = (
  id: SP,
  kind: Exclude<PanelKind, 'root'>,
  defaultVisible = false,
  label?: string,
): PanelDef => ({
  id,
  kind,
  parent: MAIN_PARENT,
  group: MAIN_GROUP,
  defaultVisible,
  ...(label ? { label } : null),
});

/**
 * Single source of truth for panels.
 *
 * ✅ Manage panels are first-class overlays (in mainOverlay).
 * ✅ Pending Rewards is NOT an overlay: local inline child of Manage Sponsorships.
 */
export const PANELS: readonly PanelDef[] = [
  // Root app container for trading
  root(SP.MAIN_TRADING_PANEL, true),

  // Non-radio chrome under main root
  child(SP.TRADE_CONTAINER_HEADER, 'panel', SP.MAIN_TRADING_PANEL, true),

  /**
   * Main overlays (radio group: mainOverlay)
   * Children of TRADE_CONTAINER_HEADER
   */
  overlay(SP.TRADING_STATION_PANEL, 'panel', true),
  overlay(SP.TOKEN_LIST_SELECT_PANEL, 'list', true),

  overlay(SP.ACCOUNT_LIST_SELECT_PANEL, 'list', false),
  overlay(SP.ACCOUNT_LIST_REWARDS_PANEL, 'list', false),

  overlay(SP.TOKEN_PANEL, 'list', false),
  overlay(SP.ERROR_MESSAGE_PANEL, 'panel', false),

  // Manage overlays as first-class main overlays
  overlay(SP.MANAGE_SPONSORSHIPS_PANEL, 'panel', false),
  overlay(SP.STAKING_SPCOINS_PANEL, 'panel', false),

  // Detail/manage overlays (full-screen overlays in the same radio set)

  /**
   * ✅ Pending Rewards is LOCAL/INLINE state under Manage Sponsorships.
   * - NOT in mainOverlay radio group
   * - NOT a stack overlay
   * - Must not be auto-hidden by overlay switching
   */
  child(SP.MANAGE_PENDING_REWARDS, 'panel', SP.MANAGE_SPONSORSHIPS_PANEL, false),

  // Trading view subtree (non-radio)
  child(SP.SELL_SELECT_PANEL, 'panel', SP.TRADING_STATION_PANEL, true),
  child(SP.BUY_SELECT_PANEL, 'panel', SP.TRADING_STATION_PANEL, true),
  child(SP.ADD_SPONSORSHIP_PANEL, 'panel', SP.TRADING_STATION_PANEL, false),
  child(SP.CONFIG_SPONSORSHIP_PANEL, 'panel', SP.ADD_SPONSORSHIP_PANEL, false),

  // Staking subtree
  child(SP.STAKE_TRADING_SPCOINS_PANEL, 'panel', SP.STAKING_SPCOINS_PANEL, false),

  // Optional trading config panel (if used)
  child(SP.CONFIG_SLIPPAGE_PANEL, 'panel', SP.TRADING_STATION_PANEL, false),

  // Inline controls under Trading
  child(SP.SWAP_ARROW_BUTTON, 'control', SP.TRADING_STATION_PANEL, true),
  child(SP.CONNECT_TRADE_BUTTON, 'control', SP.TRADING_STATION_PANEL, true),
  child(SP.FEE_DISCLOSURE, 'control', SP.TRADING_STATION_PANEL, true),
  child(SP.AFFILIATE_FEE, 'control', SP.TRADING_STATION_PANEL, true),

  // Buttons
  child(SP.ADD_SPONSORSHIP_BUTTON, 'button', SP.BUY_SELECT_PANEL, false),
  child(SP.MANAGE_SPONSORSHIPS_BUTTON, 'button', SP.SELL_SELECT_PANEL, false),
] as const;

/** ---- Fast lookup indexes (optional but usually worth it) ---- */

export const PANELS_BY_ID: ReadonlyMap<SP, PanelDef> = (() => {
  const m = new Map<SP, PanelDef>();
  for (const p of PANELS) m.set(p.id, p);
  return m;
})();

export const CHILDREN_BY_PARENT: ReadonlyMap<SP, readonly PanelDef[]> = (() => {
  const m = new Map<SP, PanelDef[]>();
  for (const p of PANELS) {
    if (p.parent === undefined) continue;
    const arr = m.get(p.parent);
    if (arr) arr.push(p);
    else m.set(p.parent, [p]);
  }
  return m;
})();

export const GROUPS: ReadonlyMap<GroupId, readonly PanelDef[]> = (() => {
  const m = new Map<GroupId, PanelDef[]>();
  for (const p of PANELS) {
    if (!p.group) continue;
    const arr = m.get(p.group);
    if (arr) arr.push(p);
    else m.set(p.group, [p]);
  }
  return m;
})();

/** Dev-only guard against duplicate IDs (cheap + catches bugs early) */
if (process.env.NODE_ENV !== 'production') {
  const seen = new Set<SP>();
  for (const p of PANELS) {
    if (seen.has(p.id)) {
      // eslint-disable-next-line no-console
      console.error('[panelConfig] Duplicate panel id:', p.id, p);
      throw new Error(`[panelConfig] Duplicate panel id: ${String(p.id)}`);
    }
    seen.add(p.id);
  }
}
