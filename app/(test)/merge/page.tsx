"use client";

import { useState } from "react";
import { defaultMissingImage } from "@/lib/network/utils";
import { loadWallets } from "@/lib/spCoin/loadWallets";
import fs from "fs";
import path from "path";
import { publicWalletPath, WalletAccount } from "@/lib/structure/types";

// Helper function to check if avatar exists
function checkAvatarExists(walletAddress: string): string {
    const avatarPath = path.join(process.cwd(), "public", publicWalletPath, walletAddress, "avatar.png");
    return fs.existsSync(avatarPath) ? `/${publicWalletPath}/${walletAddress}/avatar.png` : defaultMissingImage;
}

export default function WalletsClient({ wallets }: { wallets: WalletAccount[] }) {
    const [filter, setFilter] = useState<"All" | "Recipients" | "Agents">("All");

    // ✅ Ensure title updates correctly when state changes
    const getTitle = (filter: "All" | "Recipients" | "Agents") => {
        if (filter === "All") return "All Wallets";
        if (filter === "Recipients") return "Recipient Wallets";
        if (filter === "Agents") return "Agent Wallets";
        return "Wallets";
    };

    const filteredWallets = wallets.filter(wallet => {
        if (filter === "All") return true;
        if (filter === "Recipients") return wallet.type === "recipient";
        if (filter === "Agents") return wallet.type === "agent";
        return false;
    });

    return (
        <div>
            {/* ✅ Fixed Title Bar with Centered Title & Radio Buttons Below */}
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
                <h1 style={{
                    margin: 0,
                    fontSize: "22px",
                    fontWeight: "bold"
                }}>
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

            {/* ✅ Wallet List Below Title Bar */}
            <div style={{ marginTop: "90px", padding: "0 20px" }}>
                <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
                    {filteredWallets.map((wallet, index) => {
                        const avatarUrl = checkAvatarExists(wallet.address);
                        const isMissingAvatar = avatarUrl === defaultMissingImage;

                        return (
                            <li
                                key={wallet.address}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "12px",
                                    backgroundColor: index % 2 === 0 ? "#d6d6d6" : "#f5f5f5",
                                    marginBottom: "10px",
                                    borderRadius: "8px"
                                }}
                            >
                                <div style={{ textAlign: "center", marginRight: "12px" }}>
                                    <img
                                        src={avatarUrl}
                                        alt="Avatar"
                                        width="100"
                                        height="100"
                                        style={{
                                            borderRadius: "50%",
                                            border: "2px solid #ccc"
                                        }}
                                    />
                                    {isMissingAvatar && (
                                        <div style={{
                                            color: "red",
                                            fontSize: "16px",
                                            marginTop: "4px",
                                            fontWeight: "bold"
                                        }}>
                                            Missing Avatar
                                        </div>
                                    )}
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
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
