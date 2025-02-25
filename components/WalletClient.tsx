"use client";

import { useState } from "react";

interface BlockScanner {
    blockchain: string;
    explorer?: string;
    url?: string;
}

interface Wallet {
    name: string;
    symbol: string;
    type: string;
    website: string;
    description: string;
    status: string;
    address: string;
    "block-scanners": BlockScanner[];
}

interface WalletsClientProps {
    wallets: Wallet[];
}

export default function WalletsClient({ wallets }: WalletsClientProps) {
    const [filter, setFilter] = useState<"All" | "Recipients" | "Agents">("All");

    const getTitle = (filter: "All" | "Recipients" | "Agents") => {
        return filter === "All" ? "All Wallets" : `${filter} Wallets`;
    };

    const filteredWallets = wallets.filter(wallet =>
        filter === "All" || wallet.type === filter.toLowerCase()
    );

    return (
        <div>
            <div style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                backgroundColor: "#333",
                color: "#fff",
                padding: "10px 20px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                zIndex: 1000
            }}>
                <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "bold" }}>
                    {getTitle(filter)}
                </h1>
                <div style={{ display: "flex", gap: "10px", fontSize: "16px", marginTop: "8px" }}>
                    {["All", "Recipients", "Agents"].map(option => (
                        <label key={option} style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                            <input
                                type="radio"
                                name="walletFilter"
                                value={option}
                                checked={filter === option}
                                onChange={() => setFilter(option as "All" | "Recipients" | "Agents")}
                                style={{ marginRight: "5px" }}
                            />
                            {option}
                        </label>
                    ))}
                </div>
            </div>

            <div style={{ marginTop: "90px", padding: "0 20px" }}>
                <ul>
                    {filteredWallets.map(wallet => (
                        <li key={wallet.address}>{wallet.name}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
