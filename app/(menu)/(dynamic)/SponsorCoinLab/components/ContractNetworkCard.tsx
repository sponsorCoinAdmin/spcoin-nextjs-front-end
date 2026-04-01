import React, { type Dispatch, type SetStateAction } from 'react';
import Image from 'next/image';
import type { ConnectionMode } from '../scriptBuilder/types';
import LabCardHeader from './LabCardHeader';

type Props = {
  className: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  inputStyle: string;
  logo: {
    selectedSponsorCoinLogoURL: string;
    selectedSponsorCoinVersionEntry?: { name?: string };
  };
  version: {
    selectedSponsorCoinVersion: string;
    setSelectedSponsorCoinVersion: (value: string) => void;
    sponsorCoinVersionChoices: Array<{ id: string; version: string }>;
    canIncrementSponsorCoinVersion: boolean;
    canDecrementSponsorCoinVersion: boolean;
    adjustSponsorCoinVersion: (direction: 1 | -1) => void;
    selectedVersionSignerKey: string;
    displayedVersionHardhatAccountIndex: number;
    selectedVersionSymbolWidthCh: number;
    selectedVersionSymbol: string;
  };
  contract: {
    contractAddress: string;
    selectedSponsorCoinVersionEntry?: { name?: string };
    isRemovingFromApp: boolean;
    onRemoveFromApp: () => void;
  };
  network: {
    mode: ConnectionMode;
    setMode: (value: ConnectionMode) => void;
    allowModeSelection: boolean;
    shouldPromptHardhatBaseConnect: boolean;
    connectHardhatBaseFromNetworkLabel: () => Promise<void>;
    activeNetworkName: string;
    chainIdDisplayValue: string;
    chainIdDisplayWidthCh: number;
    showHardhatConnectionInputs: boolean;
    setShowHardhatConnectionInputs: Dispatch<SetStateAction<boolean>>;
    cogSrc: any;
    rpcUrl: string;
    setRpcUrl: (value: string) => void;
    effectiveConnectedAddress: string;
  };
};

export default function ContractNetworkCard({
  className,
  isExpanded,
  onToggleExpand,
  inputStyle,
  logo,
  version,
  contract,
  network,
}: Props) {
  return (
    <article className={className}>
      <LabCardHeader
        title="Active Sponsor Coin Contract"
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        leftSlot={
          <div className="relative -left-[9px] -top-[10px] flex h-[33px] w-[33px] items-center justify-center overflow-hidden rounded-xl bg-[#0E111B]">
            {logo.selectedSponsorCoinLogoURL ? (
              <Image
                src={logo.selectedSponsorCoinLogoURL}
                alt={String(logo.selectedSponsorCoinVersionEntry?.name || 'Sponsor Coin')}
                width={33}
                height={33}
                className="h-full w-full object-contain"
                unoptimized
              />
            ) : (
              <span className="text-[10px] text-slate-400">No logo</span>
            )}
          </div>
        }
      />
      <div className="grid grid-cols-1 gap-3">
        <section className="rounded-xl border border-[#31416F] bg-[#0B1220] p-4">
          <h3 className="text-center text-lg font-semibold text-[#5981F3]">Select SpCoin Contract to Activate</h3>
          <div className="grid grid-cols-1 gap-3">
            <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
              <span className="text-sm font-semibold text-[#8FA8FF]">Contract Address</span>
              <input className={inputStyle} value={contract.contractAddress} readOnly placeholder="Contract address" />
            </label>
            <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto]">
              <span className="text-sm font-semibold text-[#8FA8FF]">Token Name:</span>
              <input
                className={`${inputStyle} min-w-0`}
                readOnly
                value={String(contract.selectedSponsorCoinVersionEntry?.name || '')}
                placeholder="Selected deployed SponsorCoin name"
              />
              <div className="flex shrink-0 items-center justify-self-end gap-2">
                <span className="text-sm font-semibold text-[#8FA8FF]">Symbol</span>
                <input
                  className="min-w-0 rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white"
                  style={{ width: `${version.selectedVersionSymbolWidthCh * 1.1}ch` }}
                  readOnly
                  value={version.selectedVersionSymbol}
                  placeholder="symbol"
                />
              </div>
            </div>
            <div className="flex w-full flex-wrap items-center gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="shrink-0 text-sm font-semibold text-[#8FA8FF]">SponsorCoin Version</span>
                <div className="flex min-w-0 flex-1 items-stretch">
                  <select
                    className="w-full min-w-0 rounded-l-xl rounded-r-none border border-[#31416F] bg-[#0B1020] px-2 py-2 text-sm text-white outline-none transition-colors focus:border-[#8FA8FF]"
                    value={version.selectedSponsorCoinVersion}
                    onChange={(e) => version.setSelectedSponsorCoinVersion(e.target.value)}
                    aria-label="SponsorCoin Version (Hardhat row)"
                    title="SponsorCoin Version"
                  >
                    {version.sponsorCoinVersionChoices.length === 0 ? <option value="">(no deployment map entries)</option> : null}
                    {version.sponsorCoinVersionChoices.map((entry) => (
                      <option key={`spcoin-version-row-${entry.id}`} value={entry.id}>
                        {entry.version}
                      </option>
                    ))}
                  </select>
                  <div className="flex w-[23px] flex-col">
                    <button
                      type="button"
                      onClick={() => {
                        if (version.canIncrementSponsorCoinVersion) version.adjustSponsorCoinVersion(1);
                      }}
                      className={`h-1/2 min-h-0 rounded-tr-xl border border-l-0 border-[#31416F] bg-[#0B1020] text-sm font-bold leading-none text-[#8FA8FF] transition-colors hover:text-black ${
                        version.canIncrementSponsorCoinVersion ? 'cursor-pointer hover:bg-green-500' : 'cursor-not-allowed hover:bg-red-500'
                      }`}
                      title="Increment SponsorCoin Version"
                      aria-disabled={!version.canIncrementSponsorCoinVersion}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (version.canDecrementSponsorCoinVersion) version.adjustSponsorCoinVersion(-1);
                      }}
                      className={`h-1/2 min-h-0 rounded-br-xl border border-l-0 border-t-0 border-[#31416F] bg-[#0B1020] text-sm font-bold leading-none text-[#8FA8FF] transition-colors hover:text-black ${
                        version.canDecrementSponsorCoinVersion ? 'cursor-pointer hover:bg-green-500' : 'cursor-not-allowed hover:bg-red-500'
                      }`}
                      title="Decrement SponsorCoin Version"
                      aria-disabled={!version.canDecrementSponsorCoinVersion}
                    >
                      -
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className={`h-[36px] rounded px-4 py-[0.28rem] text-center font-bold transition-colors disabled:cursor-not-allowed ${
                  contract.isRemovingFromApp
                    ? 'bg-red-600 text-white hover:bg-red-600'
                    : 'bg-[#E5B94F] text-black hover:bg-green-500'
                } disabled:opacity-60`}
                title="Remove selected Sponsor Coin contract from the app"
                onClick={contract.onRemoveFromApp}
                disabled={contract.isRemovingFromApp}
              >
                {contract.isRemovingFromApp ? 'Removing...' : 'Remove From App'}
              </button>
            </div>
          </div>
        </section>
        <section className="rounded-xl border border-[#31416F] bg-[#0B1220] p-4">
          <h3 className="text-center text-lg font-semibold text-[#5981F3]">Network Controller</h3>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex flex-wrap items-center gap-4">
              <div className="ml-auto flex flex-wrap items-center justify-end gap-4">
                <label className="flex items-center gap-2 text-[#8FA8FF]">
                  <input
                    type="radio"
                    name="sponsorcoin-lab-network-mode"
                    value="hardhat"
                    checked={network.mode === 'hardhat'}
                    disabled={!network.allowModeSelection}
                    onChange={() => network.setMode('hardhat')}
                    className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                  />
                  <span>Hardhat Ec2-BASE</span>
                </label>
                <label className="flex items-center gap-2 text-[#8FA8FF]">
                  <input
                    type="radio"
                    name="sponsorcoin-lab-network-mode"
                    value="metamask"
                    checked={network.mode === 'metamask'}
                    disabled={!network.allowModeSelection}
                    onChange={() => network.setMode('metamask')}
                    className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                  />
                  <span>MetaMask</span>
                </label>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
              <span
                className={`text-sm font-semibold ${
                  network.shouldPromptHardhatBaseConnect ? 'cursor-pointer text-[#F59E0B] hover:text-[#FACC15]' : 'text-[#8FA8FF]'
                }`}
                title={network.shouldPromptHardhatBaseConnect ? 'connect "Hardhat Base"' : undefined}
                onClick={network.shouldPromptHardhatBaseConnect ? () => void network.connectHardhatBaseFromNetworkLabel() : undefined}
              >
                Connected Network
              </span>
              <input
                type="text"
                value={network.activeNetworkName}
                readOnly
                className={inputStyle}
                aria-label="Connected network"
                title="Connected network"
              />
              <label className="flex items-center justify-self-end gap-2">
                <span className="text-sm font-semibold text-[#8FA8FF]">Chain Id</span>
                <input
                  type="text"
                  value={network.chainIdDisplayValue}
                  readOnly
                  className="rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white"
                  style={{ width: `${network.chainIdDisplayWidthCh}ch` }}
                />
                <button
                  type="button"
                  onClick={() => network.setShowHardhatConnectionInputs((prev) => !prev)}
                  className="-mt-[10px] inline-flex items-center justify-center bg-transparent p-0"
                  aria-label="Toggle Hardhat connection settings"
                  title="Toggle Hardhat connection settings"
                >
                  <Image
                    src={network.cogSrc}
                    alt="Toggle Hardhat connection settings"
                    className="h-6 w-6 cursor-pointer object-contain transition duration-300 hover:rotate-[360deg]"
                  />
                </button>
              </label>
            </div>
            {network.mode === 'hardhat' && network.showHardhatConnectionInputs ? (
              <div className="grid grid-cols-1 gap-3">
                <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                  <span className="text-sm font-semibold text-[#8FA8FF]">Hardhat RPC URL</span>
                  <input
                    className={inputStyle}
                    value={network.rpcUrl}
                    onChange={(e) => network.setRpcUrl(e.target.value)}
                    placeholder="Hardhat RPC URL"
                  />
                </label>
              </div>
            ) : null}
            {network.mode !== 'hardhat' ? (
              <>
                <div>
                  <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                    <span className="text-sm font-semibold text-[#8FA8FF]">Public Signer Account</span>
                    <input
                      className={inputStyle}
                      readOnly
                      disabled
                      value={network.effectiveConnectedAddress || ''}
                      placeholder="Selected account address"
                    />
                  </label>
                </div>
                <p className="text-sm text-slate-300">
                  Hardhat-specific deployment metadata is shown read-only while Network Connection Mode is not set to Hardhat Ec2-BASE.
                </p>
              </>
            ) : null}
          </div>
        </section>
      </div>
    </article>
  );
}
