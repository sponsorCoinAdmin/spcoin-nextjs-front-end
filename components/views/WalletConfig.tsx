'use client';

import { useState } from 'react';

import {
  readMeritWalletLS,
  updateMeritWalletLS,
  type MeritWalletDefaultPanel,
  type MeritWalletLocation,
} from '@/lib/spCoinWallet/meritWalletStorage';

export default function WalletConfig() {
  const [showBackgroundPage, setShowBackgroundPage] = useState(
    () => readMeritWalletLS().config.showBackgroundPage,
  );
  const [defaultPanel, setDefaultPanel] = useState<MeritWalletDefaultPanel>(
    () => readMeritWalletLS().config.defaultPanel,
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
  };

  const handleModalModeChange = (modal: boolean) => {
    setModalMode(modal);
    updateMeritWalletLS((prev) => ({ ...prev, config: { ...prev.config, modalMode: modal } }));
  };

  const handleLocationChange = (loc: MeritWalletLocation) => {
    setLocation(loc);
    updateMeritWalletLS((prev) => ({ ...prev, config: { ...prev.config, location: loc } }));
    window.dispatchEvent(new CustomEvent('meritWalletConfigChange', { detail: { location: loc } }));
  };

  const handleDefaultPanelChange = (panel: MeritWalletDefaultPanel) => {
    setDefaultPanel(panel);
    updateMeritWalletLS((prev) => ({ ...prev, config: { ...prev.config, defaultPanel: panel } }));
  };

  const defaultPanelOptions: { value: MeritWalletDefaultPanel; label: string }[] = [
    { value: 'MENU',    label: 'Menu' },
    { value: 'ACCOUNT', label: 'Account' },
    { value: 'REWARDS', label: 'Rewards' },
    { value: 'SWAP',    label: 'Swap' },
    { value: 'SPONSOR', label: 'Sponsor' },
    { value: 'OPTIONS', label: 'Options' },
  ];

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
        <span className="block text-base font-semibold text-white">
          Location
        </span>
        <div className="mt-3 space-y-3">
          {([
            { value: 'FIXED' as const, label: 'Fixed' },
            { value: 'FLOATING' as const, label: 'Floating' },
          ]).map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center justify-between gap-4 rounded-[12px] px-3 py-2 hover:bg-[#1b2130]"
            >
              <span className="text-sm font-semibold text-slate-200">
                {option.label}
              </span>
              <input
                type="radio"
                name="merit-wallet-location"
                value={option.value}
                checked={location === option.value}
                onChange={() => handleLocationChange(option.value)}
                className="h-5 w-5 cursor-pointer accent-[#5981F3]"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-[15px] border border-slate-800 bg-[#161922] px-5 py-4">
        <span className="block text-base font-semibold text-white">
          Default Popup Panel
        </span>
        <div className="mt-3 space-y-3">
          {defaultPanelOptions.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center justify-between gap-4 rounded-[12px] px-3 py-2 hover:bg-[#1b2130]"
            >
              <span className="text-sm font-semibold text-slate-200">
                {option.label}
              </span>
              <input
                type="radio"
                name="merit-wallet-default-panel"
                value={option.value}
                checked={defaultPanel === option.value}
                onChange={() => handleDefaultPanelChange(option.value)}
                className="h-5 w-5 cursor-pointer accent-[#5981F3]"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
