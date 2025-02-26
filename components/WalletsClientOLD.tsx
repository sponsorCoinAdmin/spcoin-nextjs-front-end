"use client";

import { defaultMissingImage, getWalletAvatar } from "@/lib/network/utils";
import { useState } from "react";

interface BlockScanner {
    chainId: number
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

    const getTitle = (filter: "All" | "Recipients" | "Agents") => `${filter} Wallets`;

    const filteredWallets = wallets.filter(wallet => 
        filter === "All" || wallet.type === filter.toLowerCase()
    );

    // alert(JSON.stringify(filteredWallets,null,2))

    function getAvatar(wallet: Wallet): string | undefined {
        const walletAvatar = getWalletAvatar(wallet);
        // alert(walletAvatar);
        return walletAvatar;
    }

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
                <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
                    {filteredWallets.map((wallet, index) => (
                        <li key={wallet.address} style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "12px",
                            backgroundColor: index % 2 === 0 ? "#d6d6d6" : "#f5f5f5",
                            marginBottom: "10px",
                            borderRadius: "8px"
                        }}>
                            {/* ✅ Use Preprocessed Avatar URL */}
                            <div style={{ textAlign: "center", marginRight: "12px" }}>
                                <img
                                    src={getAvatar(wallet)}
                                    alt="Avatar"
                                    width="100"
                                    height="100"
                                    style={{
                                        borderRadius: "50%",
                                        border: "2px solid #ccc"
                                    }}
                                    onError={(event) => { event.currentTarget.src = defaultMissingImage; }}
                                />
                            </div>

                            <div>
                                <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>
                                    {wallet.name || "Unknown Wallet"}
                                </div>
                                <pre style={{
                                    whiteSpace: "pre-wrap",
                                    wordWrap: "break-word",
                                    margin: "4px 0 0 12px",
                                    fontSize: "14px",
                                    color: "#333"
                                }}>
                                    {JSON.stringify(wallet, null, 2)}
                                </pre>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
