// File: @/lib/structure/exchangeContext/helpers/rewardsTreeActions.ts
import { SP_COIN_DISPLAY as SP } from '@/lib/structure';

export type RewardsMode = SP.SPONSORS | SP.RECIPIENTS | SP.AGENTS | SP.UNSPONSOR_SP_COINS;

export const REWARDS_MODES: RewardsMode[] = [SP.SPONSORS, SP.RECIPIENTS, SP.AGENTS, SP.UNSPONSOR_SP_COINS];

export const CLAIM_PENDING_PANELS: SP[] = [SP.PENDING_SPONSOR_COINS, SP.PENDING_RECIPIENT_COINS, SP.PENDING_AGENT_COINS];

function getClaimPendingPanelForMode(mode: RewardsMode): SP | null {
  switch (mode) {
    case SP.SPONSORS: return SP.PENDING_SPONSOR_COINS;
    case SP.RECIPIENTS: return SP.PENDING_RECIPIENT_COINS;
    case SP.AGENTS: return SP.PENDING_AGENT_COINS;
    case SP.UNSPONSOR_SP_COINS: return SP.PENDING_SPONSOR_COINS;
    default: return null;
  }
}

export function panelToRewardsMode(panel: SP): RewardsMode | null {
  // Tree can open either the mode panel OR the pending panel; both map to a mode.
  if (panel === SP.PENDING_SPONSOR_COINS || panel === SP.SPONSORS) return SP.SPONSORS;
  if (panel === SP.PENDING_RECIPIENT_COINS || panel === SP.RECIPIENTS) return SP.RECIPIENTS;
  if (panel === SP.PENDING_AGENT_COINS || panel === SP.AGENTS) return SP.AGENTS;

  // Staked / Unstake flow is its own rewards-mode in your design
  if (panel === SP.UNSPONSOR_SP_COINS) return SP.UNSPONSOR_SP_COINS;

  return null;
}

/**
 * ✅ Single Source of Truth for rewards selection behavior.
 *
 * Behavior:
 * 0) If selecting a pending-mode (Sponsors/Recipients/Agents), ensure MANAGE_PENDING_REWARDS is open
 * 1) Close other rewards modes (radio)
 * 2) Open selected rewards mode
 * 3) Claim config flags (radio): open the matching PENDING_* and close the other PENDING_*
 * 4) Ensure ACCOUNT_LIST_REWARDS_PANEL is open (✅ BUT do not re-open if already visible)
 *
 * NOTE:
 * - "Stake" is intentionally NOT part of this helper (stake panel is excepted).
 */
export function openRewardsModeWithPanels(args: {
  mode: RewardsMode;
  openPanel: (id: SP, reason: string) => void;
  closePanel: (id: SP, reason: string) => void;
  reasonPrefix: string;

  /**
   * If true, will open MANAGE_PENDING_REWARDS whenever selecting Sponsors/Recipients/Agents.
   * Defaults to true to keep tree + ManageSponsorshipsPanel behavior consistent.
   */
  ensureManagePending?: boolean;

  /**
   * ✅ Optional visibility check.
   * If provided, we will avoid calling openPanel() for ACCOUNT_LIST_REWARDS_PANEL
   * when it's already visible, preventing duplicate displayStack pushes.
   */
  isVisible?: (id: SP) => boolean;
}) {
  const { mode, openPanel, closePanel, reasonPrefix, isVisible } = args;
  const ensureManagePending = args.ensureManagePending ?? true;

  const isPendingMode = mode === SP.SPONSORS || mode === SP.RECIPIENTS || mode === SP.AGENTS;

  // 0) Ensure Pending section is visible when selecting a pending mode
  if (ensureManagePending && isPendingMode) {
    openPanel(SP.MANAGE_PENDING_REWARDS, `${reasonPrefix}:open ${SP[SP.MANAGE_PENDING_REWARDS]}`);
  }

  // 1) Close other modes (radio)
  for (const m of REWARDS_MODES) {
    if (Number(m) !== Number(mode)) {
      closePanel(m, `${reasonPrefix}:close ${SP[m]}`);
    }
  }

  // 2) Open selected mode
  openPanel(mode, `${reasonPrefix}:open ${SP[mode]}`);

  // 3) Claim config flags (radio)
  const claimPanel = getClaimPendingPanelForMode(mode);
  for (const p of CLAIM_PENDING_PANELS) {
    if (claimPanel && Number(p) === Number(claimPanel)) {
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
