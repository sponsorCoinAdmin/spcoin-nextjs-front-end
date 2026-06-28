'use client';

import { useState } from 'react';

import {
  readMeritWalletLS,
  updateMeritWalletLS,
  type MeritWalletLocation,
} from '@/lib/spCoinWallet/meritWalletStorage';

export default function WalletConfig() {
  const [showBackgroundPage, setShowBackgroundPage] = useState(
    () => readMeritWalletLS().config.showBackgroundPage,
  );
  const [modalMode, setModalMode] = useState<boolean>(
    () => readMeritWalletLS().config.modalMode,
  );
  const [location, setLocation] = useState<MeritWalletLocation>(
    () => readMeritWalletLS().config.location,
  );

  const handleShowBackgroundPageChange = (show: boolean) => {
    setShowBackgroundPage(show);
    updateMeritWalletLS((prev) => ({ ...prev, config: { ...prev.config, showBackgroundPage: show } }));
    window.dispatchEvent(new CustomEvent('meritWalletConfigChange', { detail: { showBackgroundPage: show } }));
  };

  const handleModalModeChange = (modal: boolean) => {
    setModalMode(modal);
    updateMeritWalletLS((prev) => ({ ...prev, config: { ...prev.config, modalMode: modal } }));
    window.dispatchEvent(new CustomEvent('meritWalletConfigChange', { detail: { modalMode: modal } }));
  };

  const handleLocationChange = (loc: MeritWalletLocation) => {
    setLocation(loc);
    updateMeritWalletLS((prev) => ({ ...prev, config: { ...prev.config, location: loc } }));
    window.dispatchEvent(new CustomEvent('meritWalletConfigChange', { detail: { location: loc } }));
  };

  return (
    <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto space-y-3 border-t border-slate-700/70 py-4">
      <label className="flex cursor-pointer items-center justify-between gap-6 rounded-[15px] border border-slate-800 bg-[#161922] px-5 py-4 hover:border-slate-700 hover:bg-[#1b2130]">
        <span>
          <span className="block text-base font-semibold text-white">
            Show Background Page
          </span>
          <span className="mt-1 block text-sm text-slate-400">
            Show the current page behind the wallet popup.
          </span>
        </span>

        <input
          type="checkbox"
          checked={showBackgroundPage}
          onChange={(event) => handleShowBackgroundPageChange(event.target.checked)}
          className="h-5 w-5 shrink-0 cursor-pointer accent-[#5981F3]"
        />
      </label>

      <label className="flex cursor-pointer items-center justify-between gap-6 rounded-[15px] border border-slate-800 bg-[#161922] px-5 py-4 hover:border-slate-700 hover:bg-[#1b2130]">
        <span>
          <span className="block text-base font-semibold text-white">
            Modal Mode
          </span>
          <span className="mt-1 block text-sm text-slate-400">
            Block interactions with the page behind the wallet popup.
          </span>
        </span>

        <input
          type="checkbox"
          checked={modalMode}
          onChange={(event) => handleModalModeChange(event.target.checked)}
          className="h-5 w-5 shrink-0 cursor-pointer accent-[#5981F3]"
        />
      </label>

      <div className="rounded-[15px] border border-slate-800 bg-[#161922] px-5 py-4">
        <span className="block text-base font-semibold text-white mb-3">
          Location
        </span>
        <div className="flex flex-wrap items-center gap-4 text-sm text-[#8FA8FF]">
          {([
            { value: 'CENTER' as const,       label: 'Center' },
            { value: 'FIXED' as const,        label: 'Fixed' },
            { value: 'FLOATING' as const,     label: 'Float' },
            { value: 'SPLIT_PANE' as const,   label: 'Split Pane' },
            { value: 'STICK_TO_TOP' as const, label: 'Top' },
          ]).map((option) => (
            <label key={option.value} className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="merit-wallet-location"
                value={option.value}
                checked={location === option.value}
                onChange={() => handleLocationChange(option.value)}
                className="h-3.5 w-3.5 shrink-0 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
              />
              <span className={location === option.value ? 'text-green-400' : 'text-[#8FA8FF]'}>
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>

    </div>
  );
}
