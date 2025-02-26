import WalletsPage from "@/components/WalletsPage";
import WalletsPageOLD from "@/components/WalletsPageOLD";
import agentWalletList from '@/resources/data/agents/agentWalletList.json';
import recipientWalletList from '@/resources/data/recipients/recipientWalletList.json';

export default function Home() {
    return (
        <main>
            <WalletsPage/>
        </main>
    );
}
