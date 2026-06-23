// File: components/shared/RoleTableComponent.tsx
'use client';

import { useEffect, useState } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import { resolveSpCoinAccountRoles } from '@/lib/spCoinLab/accountRoles';
import { appendDebugTrace } from '@/lib/utils/debugTrace';
import type { spCoinAccount } from '@/lib/structure';

const SPCOIN_ROLE_SPONSOR   = 1;
const SPCOIN_ROLE_RECIPIENT = 2;
const SPCOIN_ROLE_AGENT     = 4;

function getPersistedContractAddress(): string {
  if (typeof window === 'undefined') return '';
  try {
    const raw = window.localStorage.getItem('spCoinLabKey');
    if (!raw) return '';
    const parsed = JSON.parse(raw) as { contractAddress?: string };
    const addr = String(parsed?.contractAddress ?? '').trim();
    return /^0x[a-fA-F0-9]{40}$/.test(addr) ? addr : '';
  } catch { return ''; }
}

type RoleState = { isSponsor: boolean; isRecipient: boolean; isAgent: boolean };

interface Props {
  account?: spCoinAccount;
  accountAddress?: string;
}

export default function RoleTableComponent({ account, accountAddress }: Props) {
  const { exchangeContext } = useExchangeContext();
  const [roles, setRoles] = useState<RoleState>({ isSponsor: false, isRecipient: false, isAgent: false });

  const address     = String(account?.address ?? accountAddress ?? '').trim();
  const rpcUrl      = String((exchangeContext as any)?.network?.rpcUrl ?? '').trim();
  const appChainId  = Number((exchangeContext as any)?.network?.appChainId ?? 0);
  const chainId     = Number((exchangeContext as any)?.network?.chainId ?? 0);
  const networkSymbol = String((exchangeContext as any)?.network?.symbol ?? '').toUpperCase();
  const isHardhat   = appChainId === 31337 || chainId === 31337 || networkSymbol === 'HH_BASE';
  const readMode    = isHardhat ? 'hardhat' : 'metamask';
  const accessSource = (exchangeContext as any)?.settings?.spCoinAccessManager?.source === 'node'
    ? 'node_modules' : 'local';

  useEffect(() => {
    const contractAddr = getPersistedContractAddress();
    if (!address || !contractAddr) {
      setRoles({ isSponsor: false, isRecipient: false, isAgent: false });
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch('/api/spCoin/run-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contractAddress: contractAddr,
            rpcUrl,
            spCoinAccessSource: accessSource,
            cacheMode: 'forceRefresh',
            useCache: false,
            script: {
              id: `role-table-${address}`,
              name: 'getAccountRecord',
              network: readMode,
              steps: [{
                step: 1,
                name: 'getAccountRecord',
                panel: 'spcoin_rread',
                method: 'getAccountRecord',
                mode: readMode,
                params: [{ key: 'Account Key', value: address }],
              }],
            },
          }),
        });
        if (!res.ok || cancelled) return;
        const payload = await res.json() as {
          results?: Array<{ success?: boolean; payload?: { result?: unknown } }>;
        };
        const result = payload?.results?.[0]?.payload?.result;
        if (cancelled) return;

        const nested = (obj: unknown, ...keys: string[]): Record<string, unknown> | undefined => {
          let cur: unknown = obj;
          for (const k of keys) {
            if (!cur || typeof cur !== 'object' || Array.isArray(cur)) return undefined;
            cur = (cur as Record<string, unknown>)[k];
          }
          return cur && typeof cur === 'object' && !Array.isArray(cur)
            ? cur as Record<string, unknown> : undefined;
        };

        const r = nested(result) ?? {};
        const candidates = [
          r,
          nested(r, 'totalSpCoins'),
          nested(r, 'pendingRewards'),
          nested(r, 'totalSpCoins', 'pendingRewards'),
          nested(r, 'meta', 'rewardCalculation'),
        ].filter((c): c is Record<string, unknown> => c != null);

        const isTruthy = (v: unknown) =>
          v === true || v === 'true' || v === 1 || v === '1' || v === 'yes';

        const hasRole = (
          role: 'Sponsor' | 'Recipient' | 'Agent',
          flagKey: string,
          pendingKey: string,
        ): boolean => {
          for (const c of candidates) {
            if (resolveSpCoinAccountRoles(c).includes(role)) return true;
            if (isTruthy(c[flagKey])) return true;
            if (role === 'Recipient' && isTruthy((c as any).isRecipiet)) return true;
            for (const rv of [c.role, c.roles, c.accountRoleSummary, c.Role, c.rewardRole]) {
              if (typeof rv === 'string' && new RegExp(`\\b${role}\\b`, 'i').test(rv)) return true;
              if (typeof rv === 'number') {
                const mask = role === 'Sponsor' ? SPCOIN_ROLE_SPONSOR : role === 'Recipient' ? SPCOIN_ROLE_RECIPIENT : SPCOIN_ROLE_AGENT;
                if ((rv & mask) === mask) return true;
              }
            }
          }
          const pendingVal =
            nested(r, 'totalSpCoins', 'pendingRewards')?.[pendingKey] ??
            nested(r, 'pendingRewards')?.[pendingKey] ??
            r[pendingKey];
          try { if (BigInt(String(pendingVal ?? '0').replace(/,/g, '')) > 0n) return true; } catch { /**/ }
          return Object.prototype.hasOwnProperty.call(r, pendingKey);
        };

        const isSponsor   = hasRole('Sponsor',   'isSponsor',   'pendingSponsorRewards');
        const isRecipient = hasRole('Recipient',  'isRecipient', 'pendingRecipientRewards');
        const isAgent     = hasRole('Agent',      'isAgent',     'pendingAgentRewards');

        const ts   = nested(r, 'totalSpCoins');
        const pr   = nested(r, 'totalSpCoins', 'pendingRewards') ?? nested(r, 'pendingRewards');
        const meta = nested(r, 'meta', 'rewardCalculation');
        const fmt  = (label: string, c: Record<string, unknown> | undefined) => {
          if (!c) return `${label}=null`;
          const bitmask = typeof c.roles === 'number'
            ? `0b${c.roles.toString(2)}(${c.roles})` : JSON.stringify(c.roles);
          return `${label}:{iS=${c.isSponsor},iR=${c.isRecipient},iA=${c.isAgent}` +
            `,pSR=${c.pendingSponsorRewards},pRR=${c.pendingRecipientRewards},pAR=${c.pendingAgentRewards}` +
            `,roles=${bitmask}}`;
        };
        appendDebugTrace(
          `[RoleTable] account=${address.slice(0, 10)}` +
          ` RESULT: isSponsor=${isSponsor} isRecipient=${isRecipient} isAgent=${isAgent}` +
          ` | ${fmt('root', r)} | ${fmt('ts', ts)} | ${fmt('pr', pr)} | ${fmt('meta', meta)}`,
        );

        setRoles({ isSponsor, isRecipient, isAgent });
      } catch { /* silently ignore fetch errors */ }
    })();

    return () => { cancelled = true; };
  }, [address, rpcUrl, readMode, accessSource]);

  return (
    <div className="flex flex-col items-center gap-0.5">
      <table className="border-collapse text-xs font-bold text-white">
        <tbody>
          <tr>
            <td
              className={`border border-black px-2 py-0.5 text-center cursor-default ${roles.isSponsor ? 'bg-green-600' : 'bg-red-600'}`}
              title={roles.isSponsor ? 'Sponsor Account' : 'Not a Sponsor Account'}
            ><span className="inline-block scale-[1.15]">S</span></td>
            <td
              className={`border border-black px-2 py-0.5 text-center cursor-default ${roles.isRecipient ? 'bg-green-600' : 'bg-red-600'}`}
              title={roles.isRecipient ? 'Recipient Account' : 'Not a Recipient Account'}
            ><span className="inline-block scale-[1.15]">R</span></td>
            <td
              className={`border border-black px-2 py-0.5 text-center cursor-default ${roles.isAgent ? 'bg-green-600' : 'bg-red-600'}`}
              title={roles.isAgent ? 'Agent Account' : 'Not an Agent Account'}
            ><span className="inline-block scale-[1.15]">A</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
