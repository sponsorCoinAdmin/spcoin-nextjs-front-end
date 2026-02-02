// File: @/lib/structure/exchangeContext/helpers/rewardsTreeActions.ts
import { SP_COIN_DISPLAY as SP } from '@/lib/structure';

/**
 * ✅ Rewards "modes" are ONLY:
 * - Pending claim panels (per account type)
 * - Unstake flow
 *
 * 🚫 Removed completely:
 * - SPONSORS
 * - RECIPIENTS
 * - AGENTS
 */
export type RewardsMode =
  | SP.PENDING_SPONSOR_COINS
  | SP.PENDING_RECIPIENT_COINS
  | SP.PENDING_AGENT_COINS
  | SP.UNSPONSOR_SP_COINS;

/** ✅ Radio group list for rewards selection */
export const REWARDS_MODES: RewardsMode[] = [
  SP.PENDING_SPONSOR_COINS,
  SP.PENDING_RECIPIENT_COINS,
  SP.PENDING_AGENT_COINS,
  SP.UNSPONSOR_SP_COINS,
];

/** ✅ Pending claim flags */
export const CLAIM_PENDING_PANELS: SP[] = [
  SP.PENDING_SPONSOR_COINS,
  SP.PENDING_RECIPIENT_COINS,
  SP.PENDING_AGENT_COINS,
];

/**
 * ✅ Tree can open either the mode panel OR any panel that should behave like a mode.
 * Now the only "mode panels" are the PENDING_* panels and UNSPONSOR.
 */
export function panelToRewardsMode(panel: SP): RewardsMode | null {
  if (panel === SP.PENDING_SPONSOR_COINS) return SP.PENDING_SPONSOR_COINS;
  if (panel === SP.PENDING_RECIPIENT_COINS) return SP.PENDING_RECIPIENT_COINS;
  if (panel === SP.PENDING_AGENT_COINS) return SP.PENDING_AGENT_COINS;

  if (panel === SP.UNSPONSOR_SP_COINS) return SP.UNSPONSOR_SP_COINS;

  return null;
}

/**
 * ✅ Single Source of Truth for rewards selection behavior.
 *
 * Behavior:
 * 0) If selecting a PENDING_* panel, ensure MANAGE_PENDING_REWARDS is open
 * 1) Close other rewards modes (radio)
 * 2) Open selected mode
 * 3) Pending-claim flags (radio):
 *    - If selected mode is a PENDING_* panel: open it and close other PENDING_*
 *    - If selected mode is UNSPONSOR_SP_COINS: close ALL PENDING_* panels
 * 4) Ensure ACCOUNT_LIST_REWARDS_PANEL is open (✅ but don't re-open if already visible)
 */
export function openRewardsModeWithPanels(args: {
  mode: RewardsMode;
  openPanel: (id: SP, reason: string) => void;
  closePanel: (id: SP, reason: string) => void;
  reasonPrefix: string;
  ensureManagePending?: boolean;
  isVisible?: (id: SP) => boolean;
}) {
  const { mode, openPanel, closePanel, reasonPrefix, isVisible } = args;
  const ensureManagePending = args.ensureManagePending ?? true;

  const isPendingClaimMode =
    mode === SP.PENDING_SPONSOR_COINS || mode === SP.PENDING_RECIPIENT_COINS || mode === SP.PENDING_AGENT_COINS;

  // 0) Ensure Pending section is visible when selecting a pending-claim mode
  if (ensureManagePending && isPendingClaimMode) {
    openPanel(SP.MANAGE_PENDING_REWARDS, `${reasonPrefix}:open ${SP[SP.MANAGE_PENDING_REWARDS]}`);
  }

  // 1) Close other modes (radio)
  for (const m of REWARDS_MODES) {
    if (Number(m) !== Number(mode)) {
      closePanel(m as unknown as SP, `${reasonPrefix}:close ${SP[m as unknown as SP]}`);
    }
  }

  // 2) Open selected mode
  openPanel(mode as unknown as SP, `${reasonPrefix}:open ${SP[mode as unknown as SP]}`);

  // 3) Pending-claim flags (radio)
  for (const p of CLAIM_PENDING_PANELS) {
    if (isPendingClaimMode && Number(p) === Number(mode)) {
      openPanel(p, `${reasonPrefix}:open ${SP[p]}`);
    } else {
      closePanel(p, `${reasonPrefix}:close ${SP[p]}`);
    }
  }

  // 4) Ensure shared container is open (✅ do not re-open if already visible)
  const container = SP.ACCOUNT_LIST_REWARDS_PANEL;
  const alreadyOpen = typeof isVisible === 'function' ? !!isVisible(container) : false;

  if (!alreadyOpen) {
    openPanel(container, `${reasonPrefix}:open ${SP[container]}`);
  }
}
