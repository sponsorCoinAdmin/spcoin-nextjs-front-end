'use client'
import { defaultMissingImage } from "@/lib/network/utils";
import { loadWallets } from "@/lib/spCoin/loadWallets";
import { publicWalletPath, Wallet } from "@/lib/structure/types";
import fs from "fs";
import path from "path";
import { useState } from "react";

// Helper function to check if avatar exists
function checkAvatarExists(walletAddress: string): string {
    const avatarPath = path.join(process.cwd(), "public", publicWalletPath, walletAddress, "avatar.png");
    return fs.existsSync(avatarPath) ? `/${publicWalletPath}/${walletAddress}/avatar.png` : defaultMissingImage;
}

export default async function WalletsPage() {
    const wallets = await loadWallets(publicWalletPath); // Fetch wallets at build time

    return (
        <WalletsClient wallets={wallets} />
    );
}

// ✅ Move state and filtering logic to client-side
function WalletsClient({ wallets }: { wallets: Wallet[] }) {
    const [filter, setFilter] = useState<"All" | "Recipients" | "Agents">("All");

    // ✅ Function to format title properly
    const getTitle = () => {
        switch (filter) {
            case "All":
                return "All Wallets";
            case "Recipients":
                return "Recipient Wallets";
            case "Agents":
                return "Agent Wallets";
            default:
                return "Wallets";
        }
    };

    const handleFilterChange = (option: "All" | "Recipients" | "Agents") => {
        setFilter(option); // ✅ Ensure state updates correctly
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
                {/* ✅ Dynamic Title (Centered & Updated Correctly) */}
                <h1 style={{
                    margin: 0,
                    fontSize: "22px",
                    fontWeight: "bold"
                }}>
                    {getTitle()}
                </h1>

                {/* ✅ Radio Buttons Below the Title */}
                <div style={{ display: "flex", gap: "10px", fontSize: "16px", marginTop: "8px" }}>
                    {["All", "Recipients", "Agents"].map(option => (
                        <label key={option} style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                            <input
                                type="radio"
                                name="walletFilter"
                                value={option}
                                checked={filter === option}
                                onChange={() => handleFilterChange(option as "All" | "Recipients" | "Agents")}
                                style={{ marginRight: "5px" }}
                            />
                            {option}
                        </label>
                    ))}
                </div>
            </div>

            {/* ✅ Wallet List (Properly Spaced Below Title Bar) */}
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
                                {/* Avatar Image */}
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
                                    {/* Display Missing Avatar message */}
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
                                    {/* Wallet Name */}
                                    <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>
                                        {wallet.name || "Unknown Wallet"}
                                    </div>
                                    {/* Wallet Data */}
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
