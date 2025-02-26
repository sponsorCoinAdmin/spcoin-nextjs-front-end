"use client";

import { useState } from "react";

export default function WalletsClient() {
    const [filter, setFilter] = useState<"All" | "Recipients" | "Agents">("All");

    // ✅ Ensure title updates correctly when state changes
    const getTitle = (filter: "All" | "Recipients" | "Agents") => {
        if (filter === "All") return "All Wallets";
        if (filter === "Recipients") return "Recipient Wallets";
        if (filter === "Agents") return "Agent Wallets";
        return "Wallets";
    };

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
                {/* ✅ Dynamic Title (Will update correctly) */}
                <h1 style={{
                    margin: 0,
                    fontSize: "22px",
                    fontWeight: "bold"
                }}>
                    {getTitle(filter)}
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
                                onChange={() => setFilter(option as "All" | "Recipients" | "Agents")}
                                style={{ marginRight: "5px" }}
                            />
                            {option}
                        </label>
                    ))}
                </div>
            </div>

            {/* ✅ Wallet List Placeholder */}
            <div style={{ marginTop: "90px", padding: "0 20px" }}>
                <p>Wallet list goes here...</p>
            </div>
        </div>
    );
}
