'use client';

import { useState, useEffect, useMemo } from 'react';
import { defaultMissingImage } from '@/lib/network/utils';
import { WalletAccount } from '@/lib/structure';

export default function Page() {
  const [wallets, setWallets] = useState<WalletAccount[]>([]);
  const [filter, setFilter] = useState<'All' | 'Recipients' | 'Agents'>('All');

  useEffect(() => {
    async function loadWallets() {
      try {
        const res = await fetch('/wallets.json');
        const data = await res.json();
        setWallets(data);
      } catch (err) {
        console.error('Failed to load wallets', err);
      }
    }

    loadWallets();
  }, []);

  const filteredWallets = useMemo(() => {
    return wallets.filter(wallet => {
      if (filter === 'All') return true;
      if (filter === 'Recipients') return wallet.type === 'recipient';
      if (filter === 'Agents') return wallet.type === 'agent';
      return false;
    });
  }, [wallets, filter]);

  const getTitle = () => {
    if (filter === 'All') return 'All Wallets';
    if (filter === 'Recipients') return 'Recipient Wallets';
    if (filter === 'Agents') return 'Agent Wallets';
    return 'Wallets';
  };

  return (
    <div>
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 w-full bg-gray-800 text-white px-5 py-3 flex flex-col items-center z-50">
        <h1 className="text-xl font-bold">{getTitle()}</h1>
        <div className="flex gap-4 text-base mt-2">
          {['All', 'Recipients', 'Agents'].map(option => (
            <label key={option} className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="walletFilter"
                value={option}
                checked={filter === option}
                onChange={() => setFilter(option as any)}
                className="mr-2"
              />
              {option}
            </label>
          ))}
        </div>
      </div>

      {/* Wallet List */}
      <div className="mt-[90px] px-5">
        <ul className="list-none p-0 m-0">
          {filteredWallets.map((wallet, index) => {
            const logoUrl = wallet.logoURL;

            return (
              <li
                key={wallet.address}
                className={`flex items-center p-4 mb-3 rounded-lg ${
                  index % 2 === 0 ? 'bg-gray-300' : 'bg-gray-100'
                }`}
              >
                <div className="text-center mr-4">
                  <img
                    src={logoUrl}
                    alt="Logo"
                    width="100"
                    height="100"
                    className="rounded-full border-2 border-gray-400"
                    onError={e => {
                      (e.target as HTMLImageElement).src = defaultMissingImage;
                    }}
                  />
                </div>
                <div>
                  <div className="text-lg font-bold mb-2">
                    {wallet.name || 'Unknown Wallet'}
                  </div>
                  <pre className="whitespace-pre-wrap break-words ml-3 text-sm text-gray-800">
                    {JSON.stringify(wallet, null, 2)}
                  </pre>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
