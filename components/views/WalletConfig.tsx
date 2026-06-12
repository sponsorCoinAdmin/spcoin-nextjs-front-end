'use client';

interface WalletConfigProps {
  showBackgroundPage: boolean;
  onShowBackgroundPageChange: (show: boolean) => void;
}

export default function WalletConfig({
  showBackgroundPage,
  onShowBackgroundPageChange,
}: WalletConfigProps) {
  return (
    <div className="min-h-0 flex-1 border-t border-slate-700/70 px-8 py-7">
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
    </div>
  );
}
