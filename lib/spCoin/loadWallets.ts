import * as fs from "fs";
import * as path from "path";

interface WalletAddress {
    address: string;
}

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
 * Reads wallet file list from JSON and loads corresponding wallet data.
 * If jsonWalletFileList is provided, it loads wallets from the file list; otherwise, it scans the rootDir.
 * @param rootDir - Root directory containing wallet files.
 * @param jsonWalletFileList - Optional list of WalletAddress objects.
 * @returns Promise<Wallet[]>
 */
export async function loadWallets(rootDir: string, jsonWalletFileList?: WalletAddress[]): Promise<Wallet[]> {
    const absoluteRootPath = path.join(process.cwd(), "public", rootDir);

    if (jsonWalletFileList && jsonWalletFileList.length > 0) {
        try {
            const wallets: Wallet[] = [];

            for (const file of jsonWalletFileList) {
                const walletDir = path.join(absoluteRootPath, file.address);
                const walletFilePath = path.join(walletDir, "wallet.json"); // Ensuring the correct path

                if (fs.existsSync(walletFilePath)) {
                    const walletData = fs.readFileSync(walletFilePath, "utf-8");
                    const wallet: Wallet = JSON.parse(walletData);
                    wallets.push(wallet);
                } else {
                    console.warn(`Wallet file not found: ${walletFilePath}`);
                }
            }

            return wallets;
        } catch (error) {
            console.error("Error loading wallets from list:", error);
            return [];
        }
    } else {
        return fetchWallets(rootDir);
    }
}
