"use client";

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

    return <WalletsClient wallets={wallets} />;
}

// ✅ Wallet list only (Title & Radio Buttons Removed)
export function WalletsClient({ wallets }: { wallets: WalletAccount[] }) {
    return (
        <div style={{ padding: "20px" }}>
            <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
                {wallets.map((wallet, index) => {
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
    );
}
