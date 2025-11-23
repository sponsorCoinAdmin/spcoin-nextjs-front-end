// File: lib/server/loadAccounts.ts
'use server';

import * as fs from 'fs';
import * as path from 'path';
import type { WalletAccount, AccountAddress } from '../structure/types';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
// Server-only debug flag
const DEBUG_ENABLED = process.env.NEXT_SERVER_DEBUG_LOAD_ACCOUNTS === 'true';

const debugLog = createDebugLogger('loadAccounts', DEBUG_ENABLED, LOG_TIME);

/**
 * Reads account file list from JSON and loads corresponding account data.
 * If jsonAccountFileList is provided, it loads specific accounts.
 * Otherwise, it scans `public/assets/accounts/` for wallet.json files.
 *
 * @param jsonAccountFileList - Optional list of AccountAddress objects.
 * @returns Promise<WalletAccount[]>
 */
export async function loadAccounts(
  jsonAccountFileList?: AccountAddress[],
): Promise<WalletAccount[]> {
  debugLog.log?.('🔄 Starting loadAccounts on the server…', {
    hasList: !!jsonAccountFileList,
    listLength: jsonAccountFileList?.length ?? 0,
  });

  const accounts: WalletAccount[] = [];
  const accountsDir = path.join(process.cwd(), 'public', 'assets', 'accounts'); // ✅ Correct server-side path

  debugLog.log?.('📜 jsonAccountFileList', jsonAccountFileList ?? null);

  // ✅ If `jsonAccountFileList` is provided, load specific accounts
  if (jsonAccountFileList && jsonAccountFileList.length > 0) {
    debugLog.log?.('🔎 Loading accounts from provided list…');
    for (const file of jsonAccountFileList) {
      const accountFilePath = path.join(
        accountsDir,
        file.address,
        'wallet.json',
      );

      debugLog.log?.('📂 Checking account file', { accountFilePath });

      if (fs.existsSync(accountFilePath)) {
        try {
          const accountData = fs.readFileSync(accountFilePath, 'utf-8');
          const account: WalletAccount = JSON.parse(accountData);
          if (!account.logoURL) {
            account.logoURL = `/assets/accounts/${account.address}/logo.png`;
          }
          accounts.push(account);
        } catch (error) {
          // Ungated hard error logging
          console.error(
            '❌ ERROR: Processing account file',
            accountFilePath,
            error,
          );
        }
      } else {
        console.error('❌ ERROR: Account file not found', { accountFilePath });
      }
    }
  } else {
    // ✅ If `jsonAccountFileList` is NOT provided, scan all `0x*` wallet directories
    debugLog.log?.(
      '📂 No jsonAccountFileList provided. Scanning directory for wallet.json files…',
      { accountsDir },
    );

    if (!fs.existsSync(accountsDir)) {
      console.error('❌ ERROR: Accounts directory not found', { accountsDir });
      return [];
    }

    try {
      const accountFolders = fs
        .readdirSync(accountsDir)
        .filter((folder) =>
          /^0x[a-fA-F0-9]{40}$/.test(folder), // ✅ Match Ethereum addresses
        );

      for (const accountFolder of accountFolders) {
        const accountFilePath = path.join(
          accountsDir,
          accountFolder,
          'wallet.json',
        );

        debugLog.log?.('📂 Checking wallet file', { accountFilePath });

        if (fs.existsSync(accountFilePath)) {
          try {
            const accountData = fs.readFileSync(accountFilePath, 'utf-8');
            const account: WalletAccount = JSON.parse(accountData);
            if (!account.logoURL) {
              account.logoURL = `/assets/accounts/${account.address}/logo.png`;
            }
            accounts.push(account);
          } catch (error) {
            console.error(
              '❌ ERROR: Reading account file',
              accountFilePath,
              error,
            );
          }
        } else {
          console.error(
            '❌ ERROR: Account file not found in directory',
            accountFilePath,
          );
        }
      }
    } catch (error: any) {
      console.error('❌ ERROR: Scanning account directory', {
        accountsDir,
        error,
      });
      return [];
    }
  }

  debugLog.log?.('✅ Loaded accounts summary', {
    count: accounts.length,
  });

  return accounts;
}
