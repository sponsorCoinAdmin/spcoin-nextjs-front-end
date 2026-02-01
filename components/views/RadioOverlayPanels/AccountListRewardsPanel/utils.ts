// Dir: @/components/views/RadioOverlayPanels/AccountListRewardsPanel

import { SP_COIN_DISPLAY } from '@/lib/structure';
import { panelStore } from '@/lib/context/exchangeContext/panelStore';

export function shortAddr(addr: string, left = 6, right = 4) {
  const a = String(addr);
  return a.length > left + right ? `${a.slice(0, left)}…${a.slice(-right)}` : a;
}

export function getInputAccountText(opts: { vAgents: boolean; vRecipients: boolean; vSponsors: boolean }): string {
  if (opts.vAgents) return 'Agent Account:';
  if (opts.vRecipients) return 'Recipient Account:';
  if (opts.vSponsors) return 'Sponsor Account:';
  return 'Active Account:';
}

export function getAddressText(w: any): string {
  if (typeof w?.address === 'string') return w.address;

  const a = w?.address as Record<string, unknown> | undefined;
  if (!a) return 'N/A';

  const cand = a['address'] ?? a['hex'] ?? a['bech32'] ?? a['value'] ?? a['id'];
  try {
    return cand ? String(cand) : JSON.stringify(a);
  } catch {
    return 'N/A';
  }
}

export function getActionButtonAriaLabel(buttonText: string, label: string) {
  if (buttonText === 'Claim' && label === 'Sponsor') return 'Claim Sponsor SpCoin Rewards';
  if (buttonText === 'Claim' && label === 'Recipient') return 'Claim Recipient SpCoin Rewards';
  if (buttonText === 'Claim' && label === 'Agent') return 'Claim Agent SpCoin Rewards';
  if (buttonText === 'Unstake' && label === 'Staked') return 'Unstake SpCoins';
  return `${buttonText} ${label}`;
}

export function getRowLabelTitle(label: string) {
  if (label === 'Staked') return 'Staked SpCoin Quantity';
  if (label === 'Sponsor') return 'Pending Sponsor SpCoin Rewards';
  if (label === 'Recipient') return 'Pending Recipient SpCoin Rewards';
  if (label === 'Agent') return 'Pending Agent SpCoin Rewards';
  return '';
}

/**
 * Best-effort:
 * - Update panelStore (so usePanelVisible changes)
 * - Update ExchangeContext (so persistWithOptDiff runs / LS snapshot changes)
 */
export function setPanelVisibleEverywhere(ctx: any, panel: SP_COIN_DISPLAY, visible: boolean) {
  // 1) panelStore (authoritative for usePanelVisible)
  try {
    const ps: any = panelStore as any;
    if (typeof ps?.setPanelVisible === 'function') ps.setPanelVisible(panel, visible);
    else if (typeof ps?.setVisible === 'function') ps.setVisible(panel, visible);
    else if (typeof ps?.set === 'function') ps.set(panel, visible);
    else if (typeof ps?.dispatch === 'function') {
      ps.dispatch({ type: 'SET_PANEL_VISIBLE', payload: { panel, visible } });
    }
  } catch {
    // no-op
  }

  // 2) ExchangeContext (to trigger persistWithOptDiff)
  try {
    if (typeof ctx?.setExchangeContext === 'function') {
      ctx.setExchangeContext(
        (prev: any) => {
          const prevSettings = prev?.settings ?? {};
          const prevTree = Array.isArray(prevSettings.spCoinPanelTree) ? prevSettings.spCoinPanelTree : [];
          const nextTree = prevTree.map((node: any) => ({ ...node }));

          let found = false;
          for (const node of nextTree) {
            const id = Number(node?.id ?? node?.panel ?? node?.displayTypeId);
            if (!Number.isFinite(id)) continue;
            if (id === Number(panel)) {
              node.visible = !!visible;
              if (node.id !== undefined) node.id = id;
              if (node.panel !== undefined) node.panel = id;
              found = true;
              break;
            }
          }

          if (!found) {
            nextTree.push({
              id: Number(panel),
              panel: Number(panel),
              visible: !!visible,
              name: SP_COIN_DISPLAY[panel] ?? String(panel),
            });
          }

          return {
            ...prev,
            settings: {
              ...prevSettings,
              spCoinPanelTree: nextTree,
            },
          };
        },
        'AccountListRewardsPanel:chevronToggle',
      );
    }
  } catch {
    // no-op
  }
}
