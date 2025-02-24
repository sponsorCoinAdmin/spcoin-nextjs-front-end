import * as fs from "fs";
import * as path from "path";

// Define Wallet type
export interface Wallet {
    id: number;
    name: string;
    balance: number;
}

// Define the structure for pairing avatar.png and wallet.json with the address
export interface WalletWithAvatar {
    address: string;  // The name of the directory where the files reside
    data: {           // Contains both avatar and wallet data
        avatar: string;  // The name of the avatar file
        wallet: Wallet;  // The wallet object from wallet.json
    };
}

// Function to recursively find avatar.png and wallet.json files
export async function getWallets(rootDir: string): Promise<WalletWithAvatar[]> {
    const walletsWithAvatars: WalletWithAvatar[] = [];

    // Convert to absolute path
    const absolutePath = path.join(process.cwd(), "public", rootDir);

    // Check if directory exists
    if (!fs.existsSync(absolutePath)) {
        console.error(`Error: Directory '${absolutePath}' does not exist.`);
        return walletsWithAvatars; // Return empty array
    }

    async function traverseDirectory(directory: string) {
        const files = await fs.promises.readdir(directory);

        let wallet: Wallet | null = null;
        let avatar: string | null = null;
        let directoryName: string | null = null;

        for (const file of files) {
            const fullPath = path.join(directory, file);
            const stat = await fs.promises.stat(fullPath);

            if (stat.isDirectory()) {
                await traverseDirectory(fullPath); // Recursively search in subdirectories
            } else if (file === "wallet.json") {
                try {
                    const fileContent = await fs.promises.readFile(fullPath, "utf-8");
                    wallet = JSON.parse(fileContent); // Store the wallet object
                } catch (error) {
                    console.error(`Error reading JSON from ${fullPath}:`, error);
                }
            } else if (file === "avatar.png") {
                avatar = file; // Store the avatar file name
            }
        }

        // Ensure both wallet.json and avatar.png are found, and create structure
        if (wallet && avatar) {
            directoryName = path.basename(directory); // Get the name of the directory

            walletsWithAvatars.push({
                address: directoryName, // Directory name as the address
                data: {                  // Data containing avatar and wallet
                    avatar,              // Avatar file
                    wallet,              // Wallet object
                }
            });
        }
    }

    await traverseDirectory(absolutePath);
    return walletsWithAvatars;
}

// Example usage: Start searching from "/wallets" inside "public"
getWallets("wallets").then(walletsWithAvatars => {
    console.log(walletsWithAvatars);
});
