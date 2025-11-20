// File: lib/spCoin/loadAccounts.tsx
'use server';

import * as fs from "fs";
import * as path from "path";
import type { WalletAccount, AccountAddress } from "../structure/types";

/**
 * Reads account file list from JSON and loads corresponding account data.
 * If jsonAccountFileList is provided, it loads specific accounts.
 * Otherwise, it scans `public/assets/accounts/` for wallet.json files.
 *
 * @param jsonAccountFileList - Optional list of AccountAddress objects.
 * @returns Promise<WalletAccount[]>
 */
export async function loadAccounts(jsonAccountFileList?: AccountAddress[]): Promise<WalletAccount[]> {
    console.log("🔄 Starting loadAccounts on the server...");

    const accounts: WalletAccount[] = [];
    const accountsDir = path.join(process.cwd(), "public", "assets", "accounts"); // ✅ Correct server-side path

    console.warn(`📜 jsonAccountFileList = ${JSON.stringify(jsonAccountFileList, null, 2)}`);

    // ✅ If `jsonAccountFileList` is provided, load specific accounts
    if (jsonAccountFileList && jsonAccountFileList.length > 0) {
        console.log("🔎 Loading accounts from provided list...");
        for (const file of jsonAccountFileList) {
            // Use UPPERCASE directory name to match on-disk folders
            const dirName = file.address.toUpperCase();
            const accountFilePath = path.join(accountsDir, dirName, "wallet.json");

            console.log(`📂 Checking account file: ${accountFilePath}`);

            if (fs.existsSync(accountFilePath)) {
                try {
                    const accountData = fs.readFileSync(accountFilePath, "utf-8");
                    const account: WalletAccount = JSON.parse(accountData);
                    if (!account.logoURL) {
                        // Use the uppercased directory name for the logo path
                        account.logoURL = `/assets/accounts/${dirName}/logo.png`;
                    }
                    accounts.push(account);
                } catch (error) {
                    console.error(`❌ ERROR: Processing account file ${accountFilePath}:`, error);
                }
            } else {
                console.error(`❌ ERROR: Account file not found: ${accountFilePath}`);
            }
        }
    } else {
        // ✅ If `jsonAccountFileList` is NOT provided, scan all `0x*` wallet directories
        console.warn("📂 No jsonAccountFileList provided. Scanning directory for wallet.json files...");

        if (!fs.existsSync(accountsDir)) {
            console.error(`❌ ERROR: Accounts directory not found: ${accountsDir}`);
            return [];
        }

        try {
            const accountFolders = fs.readdirSync(accountsDir).filter((folder) =>
                /^0x[a-fA-F0-9]{40}$/.test(folder) // ✅ Match Ethereum addresses
            );

            for (const accountFolder of accountFolders) {
                const accountFilePath = path.join(accountsDir, accountFolder, "wallet.json");

                console.log(`📂 Checking wallet file: ${accountFilePath}`);

                if (fs.existsSync(accountFilePath)) {
                    try {
                        const accountData = fs.readFileSync(accountFilePath, "utf-8");
                        const account: WalletAccount = JSON.parse(accountData);
                        if (!account.logoURL) {
                            // Use the on-disk folder name for the logo path
                            account.logoURL = `/assets/accounts/${accountFolder}/logo.png`;
                        }
                        accounts.push(account);
                    } catch (error) {
                        console.error(`❌ ERROR: Reading account file ${accountFilePath}:`, error);
                    }
                } else {
                    console.error(`❌ ERROR: Account file not found in directory: ${accountFilePath}`);
                }
            }
        } catch (error: any) {
            console.error("❌ ERROR: Scanning account directory:", error);
            return [];
        }
    }

    console.warn(`✅ Loaded ${accounts.length} accounts.`);
    return accounts;
}
