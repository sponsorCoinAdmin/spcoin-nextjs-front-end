// File: @/lib/server/loadAccounts.ts
'use server';

import * as fs from 'fs';
import * as path from 'path';
import type { spCoinAccount, AccountAddress } from '../structure/types';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import {
  normalizeAddressForAssets,
  getAccountLogoURL,
} from '@/lib/context/helpers/assetHelpers';

const LOG_TIME = false;
// Server-only debug flag
const DEBUG_ENABLED = process.env.NEXT_SERVER_DEBUG_LOAD_ACCOUNTS === 'true';

const debugLog = createDebugLogger('loadAccounts', DEBUG_ENABLED, LOG_TIME);

/**
 * Reads account file list from JSON and loads corresponding account data.
 * If jsonAccountFileList is provided, it loads specific accounts.
 * Otherwise, it scans `public/assets/accounts/` for account.json files.
 *
 * @param jsonAccountFileList - Optional list of AccountAddress objects.
 * @returns Promise<spCoinAccount[]>
 */
export async function loadAccounts(
  jsonAccountFileList?: Array<AccountAddress | string>,
): Promise<spCoinAccount[]> {
  debugLog.log?.('🔄 Starting loadAccounts on the server…', {
    hasList: !!jsonAccountFileList,
    listLength: jsonAccountFileList?.length ?? 0,
  });

  const accounts: spCoinAccount[] = [];
  const accountsDir = path.join(process.cwd(), 'public', 'assets', 'accounts'); // ✅ Correct server-side path

  debugLog.log?.('📜 jsonAccountFileList', jsonAccountFileList ?? null);

  // ✅ If `jsonAccountFileList` is provided, load specific accounts
  if (jsonAccountFileList && jsonAccountFileList.length > 0) {
    debugLog.log?.('🔎 Loading accounts from provided list…');
    for (const file of jsonAccountFileList) {
      const rawAddress =
        typeof file === 'string' ? file : (file as AccountAddress)?.address;
      // Use canonical filesystem folder name (0X... uppercase)
      const folderName = normalizeAddressForAssets(rawAddress as any);
      if (!folderName) {
        console.error('❌ ERROR: Invalid account address in list', {
          address: rawAddress,
        });
        continue;
      }

      const accountFilePath = path.join(
        accountsDir,
        folderName,
        'account.json',
      );

      debugLog.log?.('📂 Checking account file', { accountFilePath });

      if (fs.existsSync(accountFilePath)) {
        try {
          const accountData = fs.readFileSync(accountFilePath, 'utf-8');
          const account: spCoinAccount = JSON.parse(accountData.replace(/^\uFEFF/, ''));

          // Centralized logo URL builder (address stays in its original case)
          if (!account.logoURL) {
            account.logoURL = getAccountLogoURL(account.address);
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
      '📂 No jsonAccountFileList provided. Scanning directory for account.json files…',
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
          /^0[xX][a-fA-F0-9]{40}$/.test(folder), // ✅ Match Ethereum addresses (0x or 0X)
        );

      for (const accountFolder of accountFolders) {
        const accountFilePath = path.join(
          accountsDir,
          accountFolder,
          'account.json',
        );

        debugLog.log?.('📂 Checking wallet file', { accountFilePath });

        if (fs.existsSync(accountFilePath)) {
          try {
            const accountData = fs.readFileSync(accountFilePath, 'utf-8');
            const account: spCoinAccount = JSON.parse(accountData.replace(/^\uFEFF/, ''));

            if (!account.logoURL) {
              // Prefer the address from JSON if present; fall back to folder name
              const addrForLogo =
                account.address ??
                (`0x${accountFolder.slice(2)}` as spCoinAccount['address']);
              account.logoURL = getAccountLogoURL(addrForLogo);
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
