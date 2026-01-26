// File: @/components/Pages/WalletsPage.tsx
'use client';

import { useState, useEffect } from 'react';
import { loadAccounts } from '@/lib/spCoin/loadAccounts';
import agentJsonList from '@/resources/data/agents/accounts.json';
import recipientJsonList from '@/resources/data/recipients/accounts.json';
import sponsorJsonList from '@/resources/data/sponsors/accounts.json';
import type { spCoinAccount } from '@/lib/structure';
import { defaultMissingImage, getAccountLogo } from '@/lib/context/helpers/assetHelpers';

const walletOptions = ['All', 'Agents', 'Recipients', 'Sponsors'] as const;

export default function WalletsPage() {
    const [walletCache, setWalletCache] = useState<Record<string, spCoinAccount[]>>({
        All: [],
        Recipients: [],
        Agents: [],
        Sponsors: [],
    });

    const [typeOfWallets, setTypeOfWallets] =
        useState<(typeof walletOptions)[number]>('All');
    const [wallets, setWallets] = useState<spCoinAccount[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const fetchWallets = async (forceReload = false) => {
        setErr(null);

        if (!forceReload && walletCache[typeOfWallets]?.length > 0) {
            setWallets(walletCache[typeOfWallets]);
            return;
        }

        setLoading(true);

        let walletList;

        switch (typeOfWallets) {
            case 'Recipients':
                walletList = recipientJsonList;
                break;
            case 'Agents':
                walletList = agentJsonList;
                break;
            case 'Sponsors':
                walletList = sponsorJsonList;
                break;
            default:
                walletList = [...recipientJsonList, ...agentJsonList];
                break;
        }

        let cancelled = false;
        try {
            const downloadedWallets = await loadAccounts(walletList);
            if (cancelled) return;

            setWallets(downloadedWallets);
            setWalletCache(prev => ({
                ...prev,
                [typeOfWallets]: downloadedWallets,
            }));
        } catch (e: any) {
            if (!cancelled) setErr(e?.message ?? 'Failed to get wallets');
        } finally {
            if (!cancelled) setLoading(false);
        }

        return () => {
            cancelled = true;
        };
    };

    useEffect(() => {
        fetchWallets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [typeOfWallets]);

    return (
        <div>
            {/* Full-width Header Panel */}
            <div className="w-full border-[#444] text-white flex flex-col items-center">
                <h1 className="m-0 mt-2 text-[22px] font-bold">
                    {typeOfWallets} Wallets
                </h1>

                <div className="flex items-center gap-3 text-[16px] mb-8 flex-wrap justify-center">
                    {walletOptions.map(option => (
                        <label key={option} className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                name="walletFilter"
                                value={option}
                                checked={typeOfWallets === option}
                                onChange={() => setTypeOfWallets(option)}
                                className="mr-2"
                            />
                            {option}
                        </label>
                    ))}

                    <button
                        onClick={() => fetchWallets(true)}
                        className="px-3 py-1.5 text-sm cursor-pointer border-0 bg-red-500 text-white rounded"
                    >
                        RELOAD
                    </button>
                </div>
            </div>

            {/* Wallet List Section with Scrollable Pane */}
            <main>
                <div className="relative max-h-[500px] overflow-y-auto pr-2">
                    {loading ? (
                        <p className="text-center text-lg text-gray-400">Loading...</p>
                    ) : err ? (
                        <p className="text-center text-base text-red-400">Error: {err}</p>
                    ) : (
                        <ul className="list-none p-0 m-0">
                            {wallets.map((wallet: spCoinAccount, index) => (
                                <li
                                    key={`${typeOfWallets}-${wallet.address}-${index}`}
                                    className={`flex items-center p-3 mb-2 rounded ${index % 2 === 0
                                        ? 'bg-[#d6d6d6] text-[#000000]'   // light gray bg, black text
                                        : 'bg-[#000000] text-[#d6d6d6]'   // black bg, light gray text
                                        }`}
                                >
                                    <img
                                        src={getAccountLogo(wallet) || defaultMissingImage}
                                        alt="Logo"
                                        width={100}
                                        height={100}
                                        className="rounded-full border-2 border-gray-300 mr-3"
                                    />
                                    <div className="text-inherit">
                                        <div className="text-lg font-bold mb-2">
                                            {wallet.name || 'Unknown Wallet'}
                                        </div>
                                        <pre className="whitespace-pre-wrap break-words ml-3 text-sm m-0 text-inherit">
                                            {JSON.stringify(wallet, null, 2)}
                                        </pre>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </main>
        </div>
    );
}
