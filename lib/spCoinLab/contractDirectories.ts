import { promises as fs } from 'fs';
import path from 'path';

export type SpCoinContractDirectoryOption = {
  label: string;
  value: string;
};

export const SPCOIN_CONTRACTS_BASE_DIRECTORY = 'spCoinAccess/contracts';

export async function listSpCoinContractDirectories(): Promise<SpCoinContractDirectoryOption[]> {
  const baseDir = path.join(process.cwd(), 'spCoinAccess', 'contracts');
  const entries = await fs.readdir(baseDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      label: entry.name,
      value: path.posix.join('spCoinAccess', 'contracts', entry.name).replace(/\\/g, '/'),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
}
