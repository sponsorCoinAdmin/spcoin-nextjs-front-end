// File: app/(test)/recipients/WalletsClient.tsx
'use client';

import { WalletAccount } from '@/lib/structure';
import { defaultMissingImage } from '@/lib/context/helpers/NetworkHelpers';

type Props = { wallets: WalletAccount[] };

export default function WalletsClient({ wallets }: Props) {
  return (
    <div className="p-5">
      <ul className="m-0 list-none p-0">
        {wallets.map((wallet) => {
          const rawLogoUrl = wallet.logoURL || '';
          const logoUrl = rawLogoUrl || defaultMissingImage;
          const isMissingLogo = !rawLogoUrl || rawLogoUrl === defaultMissingImage;

          return (
            <li
              key={wallet.address}
              className="mb-2 flex items-center rounded-lg p-3 ring-1 ring-gray-200 shadow-sm hover:shadow odd:bg-gray-50 even:bg-gray-200"
            >
              <div className="mr-3 text-center">
                <img
                  src={logoUrl}
                  alt={`${wallet.name || 'Wallet'} logo`}
                  width={100}
                  height={100}
                  className="h-24 w-24 rounded-full border-2 border-gray-300 object-cover"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    // prevent infinite loops if the fallback fails
                    if (!img.src.endsWith(defaultMissingImage)) {
                      img.onerror = null;
                      img.src = defaultMissingImage;
                    }
                  }}
                />
                {isMissingLogo && (
                  <div className="mt-1 text-sm font-semibold text-red-600">Missing Logo</div>
                )}
              </div>

              <div className="min-w-0">
                <div className="mb-2 text-lg font-semibold text-gray-900">
                  {wallet.name || 'Unknown Wallet'}
                </div>
                <pre className="m-0 ml-3 whitespace-pre-wrap break-words text-sm text-gray-700">
                  {JSON.stringify(wallet, null, 2)}
                </pre>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
