"use client";

import { defaultMissingImage, getWalletAvatar } from "@/lib/network/utils";
import { useState } from "react";

interface BlockScanner {
    chainId: number;
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
    function getAvatar(wallet: Wallet): string | undefined {
        const walletAvatar = getWalletAvatar(wallet);
        return walletAvatar;
    }

    return (
        <div style={{ marginTop: "20px", padding: "0 20px" }}>
            <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
                {wallets.map((wallet, index) => (
                    <li key={wallet.address} style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "12px",
                        backgroundColor: index % 2 === 0 ? "#d6d6d6" : "#f5f5f5",
                        marginBottom: "10px",
                        borderRadius: "8px"
                    }}>
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
    );
}
