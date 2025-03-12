import WalletsPage from "@/components/Pages/WalletsPage";
import agentJsonList from '@/resources/data/agents/agentJsonList.json';
import recipientJsonList from '@/resources/data/recipients/recipientJsonList.json';

export default function Home() {
    return (
        <main>
            <WalletsPage/>
        </main>
    );
}
