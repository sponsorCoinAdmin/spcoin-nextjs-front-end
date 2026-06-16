'use client';

import type { MeritWalletDefaultPanel } from '@/lib/spCoinWallet/meritWalletStorage';

interface WalletConfigProps {
  showBackgroundPage: boolean;
  onShowBackgroundPageChange: (show: boolean) => void;
  modalMode: boolean;
  onModalModeChange: (modal: boolean) => void;
  defaultPanel: MeritWalletDefaultPanel;
  onDefaultPanelChange: (panel: MeritWalletDefaultPanel) => void;
}

export default function WalletConfig({
  showBackgroundPage,
  onShowBackgroundPageChange,
  modalMode,
  onModalModeChange,
  defaultPanel,
  onDefaultPanelChange,
}: WalletConfigProps) {
  const defaultPanelOptions: {
    value: MeritWalletDefaultPanel;
    label: string;
  }[] = [
    { value: 'MENU', label: 'Menu' },
    { value: 'ACCOUNT', label: 'Account' },
    { value: 'REWARDS', label: 'Rewards' },
    { value: 'SWAP', label: 'Swap' },
    { value: 'SPONSOR', label: 'Sponsor' },
    { value: 'OPTIONS', label: 'Options' },
  ];

  return (
    <div className="min-h-0 flex-1 space-y-5 border-t border-slate-700/70 px-8 py-7">
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
          onChange={(event) => onShowBackgroundPageChange(event.target.checked)}
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
          onChange={(event) => onModalModeChange(event.target.checked)}
          className="h-5 w-5 shrink-0 cursor-pointer accent-[#5981F3]"
        />
      </label>

      <fieldset className="rounded-[15px] border border-slate-800 bg-[#161922] px-5 py-4">
        <legend className="px-1 text-base font-semibold text-white">
          Default Popup Panel
        </legend>
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
                onChange={() => onDefaultPanelChange(option.value)}
                className="h-5 w-5 cursor-pointer accent-[#5981F3]"
              />
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
