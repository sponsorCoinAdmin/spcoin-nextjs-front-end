import * as fs from "fs";
import * as path from "path";

// Define Wallet type
export interface Wallet {
    id: number;
    name: string;
    balance: number;
}

// Function to recursively find `wallet.json` files
export async function getWallets(rootDir: string): Promise<Wallet[]> {
    const wallets: Wallet[] = [];

    // Convert to absolute path
    const absolutePath = path.join(process.cwd(), "public", rootDir);

    // Check if directory exists
    if (!fs.existsSync(absolutePath)) {
        console.error(`Error: Directory '${absolutePath}' does not exist.`);
        return wallets; // Return empty array
    }

    async function traverseDirectory(directory: string) {
        const files = await fs.promises.readdir(directory);

        for (const file of files) {
            const fullPath = path.join(directory, file);
            const stat = await fs.promises.stat(fullPath);

            if (stat.isDirectory()) {
                await traverseDirectory(fullPath); // Recursively search in subdirectories
            } else if (file === "wallet.json") { // ✅ Look only for "wallet.json"
                try {
                    const fileContent = await fs.promises.readFile(fullPath, "utf-8");
                    const wallet: Wallet = JSON.parse(fileContent);
                    wallets.push(wallet);
                } catch (error) {
                    console.error(`Error reading JSON from ${fullPath}:`, error);
                }
            }
        }
    }

    await traverseDirectory(absolutePath);
    return wallets;
}

// Example usage: Start searching from "/wallets" inside "public"
getWallets("wallets").then(wallets => {
    console.log(wallets);
});
