import { getWallets } from "@/lib/hooks/wallets";

const publicWalletPath: string = "assets/wallets";

export default async function WalletsPage() {
    const walletsWithAvatars = await getWallets(publicWalletPath); // Fetch wallets at build/render time

    return (
        <div>
            <h1>Wallets</h1>
            <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
                {walletsWithAvatars.map((walletData, index) => (
                    <li 
                        key={index} 
                        style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            padding: "10px",
                            backgroundColor: index % 2 === 0 ? "#e0e0e0" : "#ffffff" // Darker grey shading
                        }}
                    >
                        {/* Display the avatar image */}
                        <img 
                            src={`/${publicWalletPath}/${walletData.address}/${walletData.data.avatar}`} 
                            alt="Avatar" 
                            width="40" 
                            height="40" 
                            style={{ marginRight: "10px" }}
                        />
                        <div>
                            {/* Display wallet name in bold */}
                            <strong>{walletData.data.wallet.name}</strong>
                            {/* Display wallet data in JSON format */}
                            <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", marginLeft: "10px", marginBottom: "0px" }}>
                                {JSON.stringify(walletData.data.wallet, null, 2)}
                            </pre>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
