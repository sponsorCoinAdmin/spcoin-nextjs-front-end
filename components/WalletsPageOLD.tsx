import WalletsClient from "./WalletsClient";
import { loadWallets } from "@/lib/spCoin/loadWallets";
import agentWalletList from '@/resources/data/agents/agentWalletList.json';
import recipientWalletList from '@/resources/data/recipients/recipientWalletList.json';

// interface WalletAddress {
//     address: string;
// }

const publicWalletPath = "assets/wallets";

type Props = {
    walletList:any
  }
  
export default async function WalletsPage({walletList}:Props) {

    console.log(`walletList = ${JSON.stringify(walletList,null,2)}`)
    const wallets = await loadWallets(publicWalletPath, walletList); // ✅ Load wallets on the server

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
                    All Wallets
                </h1>
                <div style={{ display: "flex", gap: "10px", fontSize: "16px", marginTop: "8px" }}>
                    {["All", "Recipients", "Agents"].map(option => (
                        <label key={option} style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                            <input
                                type="radio"
                                name="walletFilter"
                                value={option}
                                defaultChecked={option === "All"}
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
