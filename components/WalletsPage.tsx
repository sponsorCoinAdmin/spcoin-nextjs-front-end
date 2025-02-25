import WalletsClient from "./WalletClient";
import { loadWallets } from "@/lib/spCoin/loadWallets";
// import WalletsClient from "./WalletsClient";

const publicWalletPath = "assets/wallets";

export default async function WalletsPage() {
    const wallets = await loadWallets(publicWalletPath); // ✅ Load wallets on the server

    return <WalletsClient wallets={wallets} />; // ✅ Pass wallets as props
}
