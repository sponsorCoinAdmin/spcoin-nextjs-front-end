'use client';

import { useState, useMemo } from 'react';
import { isAddress } from 'viem';
import type { Address } from 'viem';
import { Search } from 'lucide-react';

import { SP_COIN_DISPLAY, STATUS } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import useOpenAccountComponent from '@/lib/context/hooks/useOpenAccountComponent';
import { appendDebugTrace } from '@/lib/utils/debugTrace';
import { useWalletAccountsList } from '@/lib/spCoinWallet/useWalletAccountsList';
import { truncateMiddle } from '@/lib/utils/addressUtils';
import AccountAvatar from '@/components/utility/AccountAvatar';

type Props = {
  onSelect: (address: string, logoURL?: string) => void;
};

export default function SendRecipientSelectPanel({ onSelect }: Props) {
  const visible = usePanelVisible(SP_COIN_DISPLAY.SEND_RECIPIENT_SELECT_PANEL);
  if (!visible) return null;

  return (
    <div
      id="SEND_RECIPIENT_SELECT_PANEL"
      className="flex h-full min-h-0 w-full flex-col overflow-hidden"
    >
      <SendRecipientSelectPanelInner onSelect={onSelect} />
    </div>
  );
}

function SendRecipientSelectPanelInner({ onSelect }: { onSelect: (address: string, logoURL?: string) => void }) {
  const [query, setQuery] = useState('');
  const { visibleAccounts } = useWalletAccountsList();

  const trimmed = query.trim();
  const isRawAddress = isAddress(trimmed);

  const filtered = useMemo(() => {
    if (!trimmed) return visibleAccounts;
    const lower = trimmed.toLowerCase();
    return visibleAccounts.filter(
      (a) =>
        a.address.toLowerCase().includes(lower) ||
        a.label?.toLowerCase().includes(lower) ||
        (a as any).name?.toLowerCase().includes(lower),
    );
  }, [visibleAccounts, trimmed]);

  const handleSelect = (address: string, logoURL?: string) => {
    if (!isAddress(address)) return;
    onSelect(address, logoURL);
  };

  return (
    <>
      {/* Search / paste input */}
      <div className="relative border-b border-slate-700/70 px-4 py-3">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          className="w-full rounded-[8px] bg-[#11162A] pl-8 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:ring-1 focus:ring-[#5981F3]"
          placeholder="Enter or paste recipient address..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {/* "Use this address" row when a raw valid address is typed */}
      {isRawAddress && (
        <button
          type="button"
          className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/70 bg-[#1a2340] hover:bg-[#243056] text-left transition-colors"
          onClick={() => handleSelect(trimmed)}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#11162A] text-[#5981F3] text-lg font-bold">
            +
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[#5981F3]">Use this address</div>
            <div className="text-xs font-mono text-slate-400 truncate">{truncateMiddle(trimmed)}</div>
          </div>
        </button>
      )}

      {/* Account list */}
      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 && !isRawAddress ? (
          <div className="p-5 text-sm text-slate-400 text-center">No accounts found.</div>
        ) : (
          filtered.map((account) => (
            <AccountRow
              key={account.address}
              logoURL={account.logoURL}
              label={account.label ?? (account as any).name ?? ''}
              address={account.address}
              onSelect={() => handleSelect(account.address, account.logoURL)}
            />
          ))
        )}
      </div>
    </>
  );
}

function AccountRow({
  logoURL,
  label,
  address,
  onSelect,
}: {
  logoURL?: string;
  label: string;
  address: string;
  onSelect: () => void;
}) {
  const openAccountComponent = useOpenAccountComponent();

  const handleInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    appendDebugTrace('SendRecipientSelectPanel:info:click', { address, label, hasLogoURL: !!logoURL });
    openAccountComponent({
      account: {
        name: label,
        symbol: '',
        type: '',
        website: '',
        description: '',
        status: STATUS.CONNECTED,
        address: address as Address,
        logoURL,
        balance: 0n,
      },
      mode: SP_COIN_DISPLAY.ACTIVE_ACCOUNT,
      source: 'SendRecipientSelectPanel:info',
    });
  };

  return (
    <div className="grid w-full grid-cols-[40px_1fr_auto] items-center gap-3 px-4 py-2 border-b border-slate-700/70 hover:bg-slate-700/50 transition-colors">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#11162A]">
        <AccountAvatar
          logoURL={logoURL}
          name={label}
          address={address}
          className="h-full w-full object-contain"
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
        />
      </div>
      <button
        type="button"
        className="min-w-0 text-left bg-transparent border-none p-0 focus:outline-none"
        onClick={onSelect}
      >
        <div className="text-sm font-semibold text-slate-200 truncate">{label}</div>
        <div className="text-xs font-mono text-slate-400 truncate">{truncateMiddle(address)}</div>
      </button>
      <button
        type="button"
        onClick={handleInfo}
        className="flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
        title="View account details"
        aria-label="View account details"
      >
        <img src="/assets/miscellaneous/info.png" alt="info" className="h-5 w-5" />
      </button>
    </div>
  );
}
