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
  traceLabel?: string;
  onTrace?: (line: string) => void;
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
  traceLabel,
  onTrace,
}: Props) {
  const traceName =
    [traceLabel, label]
      .map((entry) => String(entry ?? '').trim())
      .find(Boolean) ?? 'account-section';
  const titleText = title ?? `Toggle ${label}`;
  const imageAlt = metadata?.name ?? label;
  const metadataName = metadata?.name ?? 'Unnamed account';
  const metadataSymbol = metadata?.symbol ?? 'No symbol';
  return (
    <div
      className={`grid grid-cols-1 gap-3${
        isOpen ? ' rounded-xl border border-[#31416F] bg-[#0B1220] p-3' : ''
      }`}
    >
      <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
        <button
          type="button"
          onClick={() => {
            onTrace?.(`[ACCOUNT_POPUP_TRACE] section(${traceName}) toggle from=${String(isOpen)} to=${String(!isOpen)}`);
            onToggle();
          }}
          className="w-fit text-left text-sm font-semibold text-[#8FA8FF] transition-colors hover:text-white"
          title={titleText}
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
                    alt={imageAlt}
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
                <div className="truncate font-medium text-white">{metadataName}</div>
                <div className="truncate text-xs text-slate-400">{metadataSymbol}</div>
              </div>
            </div>
          </div>
          {extraDetails}
        </>
      ) : null}
    </div>
  );
}
