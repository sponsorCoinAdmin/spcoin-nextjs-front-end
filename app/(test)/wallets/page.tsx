import { defaultMissingImage } from "@/lib/network/utils"; // Import default missing image
import { loadWallets } from "@/lib/spCoin/loadWallets";
import fs from "fs";
import path from "path";

const publicWalletPath: string = "assets/wallets";

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

// Helper function to check if avatar exists
function checkAvatarExists(walletAddress: string): string {
    const avatarPath = path.join(process.cwd(), "public", publicWalletPath, walletAddress, "avatar.png");
    return fs.existsSync(avatarPath) ? `/${publicWalletPath}/${walletAddress}/avatar.png` : defaultMissingImage;
}

export default async function WalletsPage() {
    const wallets = await loadWallets(publicWalletPath); // Fetch wallets at build time

    return (
        <div>
            <h1>Wallets</h1>
            <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
                {wallets.map((wallet: Wallet, index: number) => {
                    const avatarUrl = checkAvatarExists(wallet.address); // Check if avatar exists
                    const isMissingAvatar = avatarUrl === defaultMissingImage;

                    return (
                        <li
                            key={wallet.address}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                padding: "12px",
                                backgroundColor: index % 2 === 0 ? "#d6d6d6" : "#f5f5f5"
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
                                {/* Display Missing Avatar message in bold red with larger font size */}
                                {isMissingAvatar && (
                                    <div style={{ color: "red", fontSize: "14px", marginTop: "4px", fontWeight: "bold" }}>
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
