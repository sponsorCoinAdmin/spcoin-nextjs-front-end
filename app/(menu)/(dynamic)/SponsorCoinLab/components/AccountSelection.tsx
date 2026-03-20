import React from 'react';
import Image from 'next/image';

type AccountMetadata = {
  logoURL?: string;
  name?: string;
  symbol?: string;
};

type Props = {
  label: string;
  title?: string;
  isOpen: boolean;
  onToggle: () => void;
  control: React.ReactNode;
  metadata?: AccountMetadata;
  metadataLabel?: string;
  extraDetails?: React.ReactNode;
};

export default function AccountSelection({
  label,
  title,
  isOpen,
  onToggle,
  control,
  metadata,
  metadataLabel = 'Metadata',
  extraDetails,
}: Props) {
  return (
    <div
      className={`grid grid-cols-1 gap-3${
        isOpen ? ' rounded-xl border border-[#31416F] bg-[#0B1220] p-3' : ''
      }`}
    >
      <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
        <button
          type="button"
          onClick={onToggle}
          className="w-fit text-left text-sm font-semibold text-[#8FA8FF] transition-colors hover:text-white"
          title={title || `Toggle ${label}`}
        >
          {label}
        </button>
        {control}
      </label>
      {isOpen ? (
        <>
          <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
            <span className="text-sm font-semibold text-[#8FA8FF]">{metadataLabel}</span>
            <div className="flex items-center gap-3 rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[#11162A]">
                {metadata?.logoURL ? (
                  <Image
                    src={metadata.logoURL}
                    alt={metadata?.name || label}
                    width={40}
                    height={40}
                    className="h-full w-full object-contain"
                    unoptimized
                  />
                ) : (
                  <span className="text-[10px] text-slate-400">No logo</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate font-medium text-white">{metadata?.name || 'Unnamed account'}</div>
                <div className="truncate text-xs text-slate-400">{metadata?.symbol || 'No symbol'}</div>
              </div>
            </div>
          </div>
          {extraDetails}
        </>
      ) : null}
    </div>
  );
}
