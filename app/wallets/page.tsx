import { getWallets } from "@/lib/spCoin/getWallets";

const publicWalletPath: string = "assets/wallets";

interface BlockScanner {
    blockchain: string;
    explorer?: string; // Optional since some entries use 'explorer' and others use 'url'
    url?: string;      // Optional since some entries use 'url' instead of 'explorer'
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

export default async function WalletsPage() {
    const wallets = await getWallets(publicWalletPath); // Fetch wallets at build time

    return (
        <div>
            <h1>Wallets</h1>
            <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
                {wallets.map((wallet, index) => {
                    return (
                        <li 
                            key={wallet.address} 
                            style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                padding: "12px",
                                backgroundColor: index % 2 === 0 ? "#d6d6d6" : "#f5f5f5" // Darker grey for better contrast
                            }}
                        >
                            <div>
                                {/* Wallet Name above the JSON */}
                                <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>
                                    {wallet.name ?? "Unknown Wallet"}
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
