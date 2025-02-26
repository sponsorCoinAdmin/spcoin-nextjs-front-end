"use client";

import { useState, useEffect } from "react";
import WalletsClient from "./WalletsClient";
import { loadWallets, Wallet } from "@/lib/spCoin/loadWallets";
import agentWalletList from "@/resources/data/agents/agentWalletList.json";
import recipientWalletList from "@/resources/data/recipients/recipientWalletList.json";

const publicWalletPath = "assets/wallets";

export default function WalletsPage() {
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [typeOfWallets, setTypeOfWallets] = useState<"All" | "Recipients" | "Agents">("All");

    useEffect(() => {
        async function fetchWallets() {
            console.log("Fetching wallets for:", typeOfWallets);

            let loadedWallets: Wallet[];

            if (typeOfWallets === "Recipients") {
                loadedWallets = await loadWallets(publicWalletPath, recipientWalletList);
                // alert(`typeOfWallets = ${typeOfWallets} Loaded wallets: ${loadedWallets}`);
            } else if (typeOfWallets === "Agents") {
                loadedWallets = await loadWallets(publicWalletPath, agentWalletList);
                // alert(`typeOfWallets = ${typeOfWallets} Loaded wallets: ${loadedWallets}`);
            } else {
                loadedWallets = await loadWallets(publicWalletPath);
                // alert(`typeOfWallets = ${typeOfWallets} Loaded wallets: ${loadedWallets}`);
            }

            setWallets(loadedWallets);
        }
        fetchWallets();
    }, [typeOfWallets]);

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
                    {typeOfWallets} Wallets
                </h1>
                <div style={{ display: "flex", gap: "10px", fontSize: "16px", marginTop: "8px" }}>
                    {["All", "Recipients", "Agents"].map(option => (
                        <label key={option} style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                            <input
                                type="radio"
                                name="walletFilter"
                                value={option}
                                checked={typeOfWallets === option}
                                onChange={() => setTypeOfWallets(option as "All" | "Recipients" | "Agents")}
                                style={{ marginRight: "5px" }}
                            />
                            {option}
                        </label>
                    ))}
                </div>
            </div>

            <div style={{ marginTop: "90px" }}>
                <WalletsClient wallets={wallets} />
            </div>
        </div>
    );
}
