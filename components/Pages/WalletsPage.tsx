"use client";

import { useState, useEffect } from "react";
import { loadWallets } from "@/lib/spCoin/loadWallets";
import { defaultMissingImage, getWalletAvatar } from "@/lib/network/utils";
import agentJsonList from "@/resources/data/agents/agentJsonList.json";
import recipientJsonList from "@/resources/data/recipients/recipientJsonList.json";
import { publicWalletPath, Wallet } from "@/lib/structure/types";

// Options for filtering wallets
const walletOptions = ["All", "Recipients", "Agents"] as const;

export default function WalletsPage() {
    // State for caching wallets for each type
    const [walletCache, setWalletCache] = useState<Record<string, WalletAccount[]>>({
        All: [],
        Recipients: [],
        Agents: []
    });

    const [typeOfWallets, setTypeOfWallets] = useState<typeof walletOptions[number]>("All");
    const [wallets, setWallets] = useState<WalletAccount[]>([]);
    const [loading, setLoading] = useState(false); // Track loading state

    /**
     * Fetch wallets only if not already cached or if reloading.
     */
    const fetchWallets = async (forceReload = false) => {
        if (!forceReload && walletCache[typeOfWallets].length > 0) {
            setWallets(walletCache[typeOfWallets]);
            return;
        }

        setLoading(true); // Show loading state
        const walletList =
            typeOfWallets === "Recipients" ? recipientJsonList :
            typeOfWallets === "Agents" ? agentJsonList : undefined;

        const downloadedWallets = await loadWallets(publicWalletPath, walletList);
        setLoading(false); // Hide loading state

        // Update state and cache
        setWallets(downloadedWallets);
        setWalletCache((prevCache) => ({
            ...prevCache,
            [typeOfWallets]: downloadedWallets
        }));
    };

    // Load wallets when typeOfWallets changes
    useEffect(() => {
        fetchWallets();
    }, [typeOfWallets]);

    return (
        <div>
            {/* Header Section */}
            <header style={{
                position: "fixed", top: 0, left: 0, width: "100%",
                backgroundColor: "#333", color: "#fff", padding: "10px 20px",
                textAlign: "center", display: "flex", flexDirection: "column",
                alignItems: "center", zIndex: 1000
            }}>
                <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "bold" }}>{typeOfWallets} Wallets</h1>
                
                {/* Wallet Type Selection & Reload Button */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "16px", marginTop: "8px" }}>
                    {walletOptions.map(option => (
                        <label key={option} style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                            <input
                                type="radio" name="walletFilter" value={option}
                                checked={typeOfWallets === option}
                                onChange={() => setTypeOfWallets(option)}
                                style={{ marginRight: "5px" }}
                            />
                            {option}
                        </label>
                    ))}
                    
                    {/* RELOAD Button */}
                    <button 
                        onClick={() => fetchWallets(true)} 
                        style={{ 
                            padding: "5px 10px", 
                            fontSize: "14px", 
                            cursor: "pointer", 
                            border: "none", 
                            backgroundColor: "#ff4d4d", 
                            color: "white", 
                            borderRadius: "5px" 
                        }}
                    >
                        RELOAD
                    </button>
                </div>
            </header>

            {/* Wallet List Section */}
            <main style={{ marginTop: "90px", padding: "0 20px" }}>
                {loading ? (
                    <p style={{ textAlign: "center", fontSize: "18px", color: "#555" }}>Loading...</p>
                ) : (
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {wallets.map((wallet, index) => (
                            <li key={`${typeOfWallets}-${wallet.address}-${index}`} style={{
                                display: "flex", alignItems: "center", padding: "12px",
                                backgroundColor: index % 2 === 0 ? "#d6d6d6" : "#f5f5f5",
                                marginBottom: "10px", borderRadius: "8px"
                            }}>
                                {/* Wallet Avatar */}
                                <img
                                    src={getWalletAvatar(wallet) || defaultMissingImage}
                                    alt="Avatar" width="100" height="100"
                                    style={{ borderRadius: "50%", border: "2px solid #ccc", marginRight: "12px" }}
                                />
                                <div>
                                    {/* Wallet Name */}
                                    <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>
                                        {wallet.name || "Unknown Wallet"}
                                    </div>
                                    {/* Wallet JSON Details */}
                                    <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", margin: "4px 0 0 12px", fontSize: "14px", color: "#333" }}>
                                        {JSON.stringify(wallet, null, 2)}
                                    </pre>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </main>
        </div>
    );
}
