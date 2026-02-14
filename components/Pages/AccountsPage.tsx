// File: @/components/Pages/AccountsPage.tsx
'use client';

import { useState, useEffect } from 'react';
import { loadAccounts } from '@/lib/spCoin/loadAccounts';
import agentJsonList from '@/resources/data/agents/accounts.json';
import recipientJsonList from '@/resources/data/recipients/accounts.json';
import sponsorJsonList from '@/resources/data/sponsors/accounts.json';
import type { spCoinAccount } from '@/lib/structure';
import { defaultMissingImage, getAccountLogo } from '@/lib/context/helpers/assetHelpers';

const accontOptions = ['Agents', 'Recipients', 'Sponsors', 'All Accounts'] as const;

export default function AccountsPage() {
    const [accontCache, setAccontCache] = useState<Record<string, spCoinAccount[]>>({
        All: [],
        Recipients: [],
        Agents: [],
        Sponsors: [],
    });

    const [typeOfAcconts, setTypeOfAcconts] =
        useState<(typeof accontOptions)[number]>('All Accounts');
    const [acconts, setAcconts] = useState<spCoinAccount[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const fetchAcconts = async (forceReload = false) => {
        setErr(null);

        if (!forceReload && accontCache[typeOfAcconts]?.length > 0) {
            setAcconts(accontCache[typeOfAcconts]);
            return;
        }

        setLoading(true);

        let accountList;

        switch (typeOfAcconts) {
            case 'Recipients':
                accountList = recipientJsonList;
                break;
            case 'Agents':
                accountList = agentJsonList;
                break;
            case 'Sponsors':
                accountList = sponsorJsonList;
                break;
            default:
                accountList = [...recipientJsonList, ...agentJsonList];
                break;
        }

        let cancelled = false;
        try {
            const downloadedAcconts = await loadAccounts(accountList);
            if (cancelled) return;

            setAcconts(downloadedAcconts);
            setAccontCache(prev => ({
                ...prev,
                [typeOfAcconts]: downloadedAcconts,
            }));
        } catch (e: any) {
            if (!cancelled) setErr(e?.message ?? 'Failed to get acconts');
        } finally {
            if (!cancelled) setLoading(false);
        }

        return () => {
            cancelled = true;
        };
    };

    useEffect(() => {
        fetchAcconts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [typeOfAcconts]);

    return (
        <div>
            {/* Full-width Header Panel */}
            <div className="w-full border-[#444] text-white flex flex-col items-center">
                <div className="flex items-center gap-3 text-[16px] mb-8 flex-wrap justify-center">
                    {accontOptions.map(option => (
                        <label key={option} className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                name="accountFilter"
                                value={option}
                                checked={typeOfAcconts === option}
                                onChange={() => setTypeOfAcconts(option)}
                                className="mr-2"
                            />
                            <span className={typeOfAcconts === option ? 'text-green-400' : ''}>
                                {option}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Accont List Section with Scrollable Pane */}
            <main>
                <div className="relative max-h-[500px] overflow-y-auto pr-2">
                    {loading ? (
                        <p className="text-center text-lg text-gray-400">Loading...</p>
                    ) : err ? (
                        <p className="text-center text-base text-red-400">Error: {err}</p>
                    ) : (
                        <ul className="list-none p-0 m-0">
                            {acconts.map((accont: spCoinAccount, index) => (
                                <li
                                    key={`${typeOfAcconts}-${accont.address}-${index}`}
                                    className={`flex items-center p-3 mb-2 rounded ${index % 2 === 0
                                        ? 'bg-[#d6d6d6] text-[#000000]'   // light gray bg, black text
                                        : 'bg-[#000000] text-[#d6d6d6]'   // black bg, light gray text
                                        }`}
                                >
                                    <img
                                        src={getAccountLogo(accont) || defaultMissingImage}
                                        alt="Logo"
                                        width={100}
                                        height={100}
                                        className="rounded-full border-2 border-gray-300 mr-3"
                                    />
                                    <div className="text-inherit">
                                        <div className="text-lg font-bold mb-2">
                                            {accont.name || 'Unknown Accont'}
                                        </div>
                                        <pre className="whitespace-pre-wrap break-words ml-3 text-sm m-0 text-inherit">
                                            {JSON.stringify(accont, null, 2)}
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
