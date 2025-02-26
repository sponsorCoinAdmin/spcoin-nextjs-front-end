"use client";

import { useState, useEffect } from "react";
import { loadWallets, Wallet } from "@/lib/spCoin/loadWallets";
import { defaultMissingImage, getWalletAvatar } from "@/lib/network/utils";
import agentWalletList from "@/resources/data/agents/agentWalletList.json";
import recipientWalletList from "@/resources/data/recipients/recipientWalletList.json";

// Define the public wallet path
const publicWalletPath = "assets/wallets";

// Options for filtering wallets
const walletOptions = ["All", "Recipients", "Agents"];

/**
 * WalletsPage Component
 * This component displays a list of cryptocurrency wallets with filtering options.
 */
export default function WalletsPage() {
    // State for storing wallets and selected wallet type
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [typeOfWallets, setTypeOfWallets] = useState<typeof walletOptions[number]>("All");

    /**
     * Fetch wallets based on the selected type.
     * Uses the loadWallets function to load data from JSON files.
     */
    useEffect(() => {
        const fetchWallets = async () => {
            const walletList =
                typeOfWallets === "Recipients" ? recipientWalletList :
                typeOfWallets === "Agents" ? agentWalletList : undefined;

            setWallets(await loadWallets(publicWalletPath, walletList));
        };
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
                {/* Wallet Type Selection */}
                <div style={{ display: "flex", gap: "10px", fontSize: "16px", marginTop: "8px" }}>
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
                </div>
            </header>

            {/* Wallet List Section */}
            <main style={{ marginTop: "90px", padding: "0 20px" }}>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {wallets.map((wallet, index) => (
                        <li key={wallet.address} style={{
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
            </main>
        </div>
    );
}
