'use client';

import { Pencil, Plus } from 'lucide-react';
import { useSpCoinWallet } from '@/lib/spCoinWallet';
import { useWalletAccountsList } from '@/lib/spCoinWallet/useWalletAccountsList';
import { normalizeAddress } from '@/lib/utils/address';

type Props = {
  onCreate: () => void;
  onEdit: (address: string) => void;
};

export default function AccountListView({ onCreate, onEdit }: Props) {
  const { hardhatAccountsLoading, hardhatAccountsError } = useSpCoinWallet();
  const { visibleAccounts, selectedAddressKey } = useWalletAccountsList();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-slate-700/70 px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Network Accounts
        </span>
        <button
          type="button"
          onClick={onCreate}
          className="flex items-center gap-1 rounded bg-[#5981F3] px-2 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#4a72e0]"
          title="Create new account"
        >
          <Plus className="h-3.5 w-3.5" />
          Create
        </button>
      </div>

      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto">
        {hardhatAccountsError ? (
          <div className="p-4 text-sm text-red-300">{hardhatAccountsError}</div>
        ) : hardhatAccountsLoading ? (
          <div className="p-4 text-sm text-slate-400">Loading accounts…</div>
        ) : visibleAccounts.length === 0 ? (
          <div className="p-4 text-sm text-slate-400">No accounts found for this network.</div>
        ) : (
          visibleAccounts.map((account) => {
            const isActive = normalizeAddress(account.address) === selectedAddressKey;
            return (
              <div
                key={account.address}
                className={[
                  'grid grid-cols-[1fr_auto] items-center gap-2 border-b border-slate-700/70 px-4 py-2',
                  isActive ? 'bg-green-900/20' : 'hover:bg-slate-700/30',
                ].join(' ')}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-white">
                      {account.label || account.name || account.symbol || 'Unnamed'}
                    </span>
                    {isActive && (
                      <span className="shrink-0 rounded bg-slate-400/25 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-200">
                        Active
                      </span>
                    )}
                  </div>
                  <span className="block truncate font-mono text-[12px] text-slate-400">
                    {account.address}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onEdit(account.address)}
                  className="flex items-center justify-center rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-600/50 hover:text-white"
                  title="Edit account"
                  aria-label="Edit account"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
