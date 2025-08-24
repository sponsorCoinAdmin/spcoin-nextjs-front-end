"use client";

import { useState } from "react";

export default function WalletsClient() {
  const [filter, setFilter] = useState<"All" | "Recipients" | "Agents">("All");

  const getTitle = (f: "All" | "Recipients" | "Agents") => {
    if (f === "All") return "All Wallets";
    if (f === "Recipients") return "Recipient Wallets";
    if (f === "Agents") return "Agent Wallets";
    return "Wallets";
  };

  return (
    <div>
      {/* Fixed Title Bar with Centered Title & Radio Buttons Below */}
      <div className="fixed top-0 left-0 w-full bg-[#333333] text-white px-5 py-2 md:py-3 text-center flex flex-col items-center z-[1000]">
        {/* Dynamic Title */}
        <h1 className="m-0 text-[22px] font-bold leading-tight">
          {getTitle(filter)}
        </h1>

        {/* Radio Buttons Below the Title */}
        <div className="flex gap-3 text-[16px] mt-2">
          {(["All", "Recipients", "Agents"] as const).map((option) => (
            <label
              key={option}
              className="flex items-center cursor-pointer select-none"
            >
              <input
                type="radio"
                name="walletFilter"
                value={option}
                checked={filter === option}
                onChange={() => setFilter(option)}
                className="mr-2 accent-[#5981F3]"
              />
              {option}
            </label>
          ))}
        </div>
      </div>

      {/* Spacer to offset the fixed header height */}
      <div className="mt-[90px] px-5">
        <p>Wallet list goes here...</p>
      </div>
    </div>
  );
}
