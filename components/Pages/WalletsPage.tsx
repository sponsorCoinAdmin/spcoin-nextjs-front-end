'use client';

import { useState, useEffect } from 'react';
import { loadAccounts } from '@/lib/spCoin/loadAccounts';
import { defaultMissingImage, getAccountLogo } from '@/lib/network/utils';
import agentJsonList from '@/resources/data/agents/agentJsonList.json';
import recipientJsonList from '@/resources/data/recipients/recipientJsonList.json';
import { WalletAccount } from '@/lib/structure/types';

const walletOptions = ['All', 'Recipients', 'Agents'] as const;

export default function WalletsPage() {
    const [walletCache, setWalletCache] = useState<Record<string, WalletAccount[]>>({
        All: [],
        Recipients: [],
        Agents: [],
    });

    const [typeOfWallets, setTypeOfWallets] = useState<typeof walletOptions[number]>('All');
    const [wallets, setWallets] = useState<WalletAccount[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchWallets = async (forceReload = false) => {
        if (!forceReload && walletCache[typeOfWallets].length > 0) {
            setWallets(walletCache[typeOfWallets]);
            return;
        }

        setLoading(true);

        const walletList =
            typeOfWallets === 'Recipients'
                ? recipientJsonList
                : typeOfWallets === 'Agents'
                    ? agentJsonList
                    : undefined;

        const downloadedWallets = await loadAccounts(walletList);
        setLoading(false);

        setWallets(downloadedWallets);
        setWalletCache((prev) => ({
            ...prev,
            [typeOfWallets]: downloadedWallets,
        }));
    };

    useEffect(() => {
        fetchWallets();
    }, [typeOfWallets]);

    return (
        <div>
            {/* Full-width Header Panel */}
            <header
                style={{
                    position: 'relative',
                    width: '100vw',                          // ⬅️ Full screen width
                    marginLeft: 'calc(-50vw + 50%)',         // ⬅️ Center header in any parent
                    backgroundColor: '#1f2639',
                }}
            >
                <div
                    style={{
                        width: '100%',
                        backgroundColor: '#333',
                        borderBottom: '1px solid #444',
                        color: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <h1 style={{ margin: 0, marginTop: '10px', fontSize: '22px', fontWeight: 'bold' }}>            {typeOfWallets} Wallets
                    </h1>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '16px',
                            marginBottom: '30px',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                        }}
                    >
                        {walletOptions.map((option) => (
                            <label
                                key={option}
                                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                            >
                                <input
                                    type="radio"
                                    name="walletFilter"
                                    value={option}
                                    checked={typeOfWallets === option}
                                    onChange={() => setTypeOfWallets(option)}
                                    style={{ marginRight: '5px' }}
                                />
                                {option}
                            </label>
                        ))}

                        <button
                            onClick={() => fetchWallets(true)}
                            style={{
                                padding: '6px 12px',
                                fontSize: '14px',
                                cursor: 'pointer',
                                border: 'none',
                                backgroundColor: '#ff4d4d',
                                color: 'white',
                                borderRadius: '5px',
                            }}
                        >
                            RELOAD
                        </button>
                    </div>
                </div>
            </header>

            {/* Wallet List Section with Scrollable Pane */}
            <main style={{ padding: '0 20px', marginTop: '20px' }}>
                <div
                    style={{
                        position: 'relative',
                        maxHeight: '500px',
                        overflowY: 'auto',
                        paddingRight: '8px',
                    }}
                >
                    {loading ? (
                        <p style={{ textAlign: 'center', fontSize: '18px', color: '#555' }}>
                            Loading...
                        </p>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {wallets.map((wallet: WalletAccount, index) => (
                                <li
                                    key={`${typeOfWallets}-${wallet.address}-${index}`}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '12px',
                                        backgroundColor: index % 2 === 0 ? '#d6d6d6' : '#f5f5f5',
                                        marginBottom: '10px',
                                        borderRadius: '8px',
                                    }}
                                >
                                    <img
                                        src={getAccountLogo(wallet) || defaultMissingImage}
                                        alt="Logo"
                                        width="100"
                                        height="100"
                                        style={{
                                            borderRadius: '50%',
                                            border: '2px solid #ccc',
                                            marginRight: '12px',
                                        }}
                                    />
                                    <div>
                                        <div
                                            style={{
                                                fontSize: '18px',
                                                fontWeight: 'bold',
                                                marginBottom: '8px',
                                            }}
                                        >
                                            {wallet.name || 'Unknown Wallet'}
                                        </div>
                                        <pre
                                            style={{
                                                whiteSpace: 'pre-wrap',
                                                wordWrap: 'break-word',
                                                margin: '4px 0 0 12px',
                                                fontSize: '14px',
                                                color: '#333',
                                            }}
                                        >
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
