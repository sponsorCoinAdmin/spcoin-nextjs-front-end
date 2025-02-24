import * as fs from "fs";
import * as path from "path";

interface BlockScanner {
    blockchain: string;
    explorer?: string;
    url?: string;
}

// Define Wallet type
export interface Wallet {
    name: string;
    symbol: string;
    type: string;
    website: string;
    description: string;
    status: string;
    address: string;
    "block-scanners": BlockScanner[];
}

/**
 * Recursively finds wallet.json files.
 *
 * @param rootDir - The base directory to search.
 * @returns An array of Wallet objects.
 */
async function fetchWallets(rootDir: string): Promise<Wallet[]> {
    const results: Wallet[] = [];
    const absolutePath = path.join(process.cwd(), "public", rootDir);

    try {
        await fs.promises.access(absolutePath);
    } catch (error) {
        console.error(`Error: Directory '${absolutePath}' does not exist.`);
        return results;
    }

    async function traverseDirectory(directory: string) {
        const files = await fs.promises.readdir(directory);

        for (const file of files) {
            const fullPath = path.join(directory, file);
            const stat = await fs.promises.stat(fullPath);

            if (stat.isDirectory()) {
                await traverseDirectory(fullPath); // Recursively search subdirectories
            } else if (file === "wallet.json") {
                try {
                    const fileContent = await fs.promises.readFile(fullPath, "utf-8");
                    const wallet: Wallet = JSON.parse(fileContent);

                    // Validate that wallet has the required properties before pushing
                    if (wallet && wallet.name && wallet.address) {
                        results.push(wallet);
                    } else {
                        console.warn(`Invalid wallet data in ${fullPath}:`, wallet);
                    }
                } catch (error) {
                    console.error(`Error reading JSON from ${fullPath}:`, error);
                }
            }
        }
    }

    await traverseDirectory(absolutePath);
    return results;
}

/**
 * Returns wallets without avatar images.
 * @param rootDir - Base directory to search.
 * @returns Array of Wallet objects.
 */
export async function getWallets(rootDir: string): Promise<Wallet[]> {
    return fetchWallets(rootDir);
}
