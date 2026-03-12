// File: app/(menu)/(dynamic)/SpCoinAccessController/components/DeploymentControllerPanel.tsx
import React from 'react';
import { DeploymentStatusBlock } from './StatusBlocks';

type DeploymentControllerPanelProps = {
  cardClass: string;
  deploymentMode: 'mocked' | 'blockcain';
  deploymentName: string;
  deploymentSymbol: string;
  deploymentDecimals: string;
  deploymentVersion: string;
  hardhatDeploymentAccountNumber: number;
  canIncrementHardhatDeploymentAccountNumber: boolean;
  canDecrementHardhatDeploymentAccountNumber: boolean;
  deploymentChainName: string;
  deploymentChainId: string;
  deploymentPathDisplayValue: string;
  deploymentFlashError: boolean;
  deploymentAccountPrivateKey: string;
  deploymentKeyRequiredMessage: string;
  deploymentVersionPrefix: string;
  deploymentPublicKey: string;
  deploymentLogoPath: string;
  deploymentStatus: string;
  deploymentStatusIsError: boolean;
  deployDisableReason: string;
  deployButtonLabel: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSetDeploymentMode: (mode: 'mocked' | 'blockcain') => void;
  onDeploymentDecimalsChange: (value: string) => void;
  onAdjustDeploymentDecimals: (direction: 1 | -1) => void;
  onDeploymentVersionChange: (value: string) => void;
  onAdjustDeploymentVersion: (direction: 1 | -1) => void;
  onHardhatDeploymentAccountNumberChange: (value: string) => void;
  onAdjustHardhatDeploymentAccountNumber: (direction: 1 | -1) => void;
  onLocalSourceDeploymentPathChange: (value: string) => void;
  onDeploy: () => Promise<void>;
  onDeploymentPrivateKeyChange: (value: string) => void;
  onDeploymentPrivateKeyBlur: () => void;
  onDeploymentLogoPathChange: (value: string) => void;
};

export default function DeploymentControllerPanel(props: DeploymentControllerPanelProps) {
  const {
    cardClass,
    deploymentMode,
    deploymentName,
    deploymentSymbol,
    deploymentDecimals,
    deploymentVersion,
    hardhatDeploymentAccountNumber,
    canIncrementHardhatDeploymentAccountNumber,
    canDecrementHardhatDeploymentAccountNumber,
    deploymentChainName,
    deploymentChainId,
    deploymentPathDisplayValue,
    deploymentFlashError,
    deploymentAccountPrivateKey,
    deploymentKeyRequiredMessage,
    deploymentVersionPrefix,
    deploymentPublicKey,
    deploymentLogoPath,
    deploymentStatus,
    deploymentStatusIsError,
    deployDisableReason,
    deployButtonLabel,
    isExpanded,
    onToggleExpand,
    onSetDeploymentMode,
    onDeploymentDecimalsChange,
    onAdjustDeploymentDecimals,
    onDeploymentVersionChange,
    onAdjustDeploymentVersion,
    onHardhatDeploymentAccountNumberChange,
    onAdjustHardhatDeploymentAccountNumber,
    onLocalSourceDeploymentPathChange,
    onDeploy,
    onDeploymentPrivateKeyChange,
    onDeploymentPrivateKeyBlur,
    onDeploymentLogoPathChange,
  } = props;
  const isDeployDisabled = deployDisableReason !== 'ENABLED';

  return (
    <div className="scrollbar-hide flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden rounded-2xl bg-[#192134] p-4">
      <div
        className="relative mb-4 border-b border-slate-700 pb-3"
        onDoubleClick={onToggleExpand}
        title={isExpanded ? 'Double-click to return to shared view' : 'Double-click to expand'}
      >
        <div className="flex min-h-10 items-center justify-center pr-12">
          <h2 className="text-center text-xl font-semibold text-[#8FA8FF]">Contract Deployment Controller</h2>
        </div>
        <button
          type="button"
          onClick={onToggleExpand}
          onDoubleClick={(event) => event.stopPropagation()}
          className="absolute -right-[9px] -top-[10px] flex h-10 w-10 items-center justify-center rounded-full bg-[#243056] text-3xl leading-none text-[#5981F3] transition-colors hover:bg-[#5981F3] hover:text-[#243056]"
          title={isExpanded ? 'Return to shared view' : 'Expand this card'}
          aria-label={isExpanded ? 'Return to shared view' : 'Expand this card'}
        >
          {isExpanded ? '×' : '+'}
        </button>
      </div>

      <div className={`${cardClass} scrollbar-hide flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-2`}>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div />
          <h3 className="justify-self-center text-xl font-semibold text-[#8FA8FF]">Contract Deployment</h3>
          <div />
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
            <span className="text-sm font-semibold text-[#8FA8FF]">Name</span>
            <input
              type="text"
              value={deploymentName}
              readOnly
              className="w-full rounded-xl border border-[#31416F] bg-[#0B1020] px-4 py-2 text-white outline-none transition-colors focus:border-[#8FA8FF]"
            />
          </label>

          <div className="mr-[10px] flex items-center justify-end gap-4 text-sm">
            <label className="flex items-center gap-2 text-[#8FA8FF]">
              <input
                type="radio"
                name="deployment-mode"
                value="mocked"
                checked={deploymentMode === 'mocked'}
                onChange={() => onSetDeploymentMode('mocked')}
                className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
              />
              <span>Mocked</span>
            </label>
            <label className="flex items-center gap-2 text-[#8FA8FF]">
              <input
                type="radio"
                name="deployment-mode"
                value="blockcain"
                checked={deploymentMode === 'blockcain'}
                onChange={() => onSetDeploymentMode('blockcain')}
                className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
              />
              <span>Blockcain</span>
            </label>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
            <span className="text-sm font-semibold text-[#8FA8FF]">Symbol</span>
            <input
              type="text"
              value={deploymentSymbol}
              readOnly
              className="w-full rounded-xl border border-[#31416F] bg-[#0B1020] px-4 py-2 text-white outline-none transition-colors focus:border-[#8FA8FF]"
            />
          </label>

          <div className="flex items-start justify-end gap-4">
            <label className="flex items-center gap-3">
              <span className="text-sm font-semibold text-[#8FA8FF]">Decimals</span>
              <div className="flex items-stretch">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  value={deploymentDecimals}
                  onChange={(event) => onDeploymentDecimalsChange(event.target.value)}
                  className="w-[4ch] min-w-[4ch] rounded-l-xl rounded-r-none border border-[#31416F] bg-[#0B1020] px-2 py-2 text-white outline-none transition-colors focus:border-[#8FA8FF]"
                />
                <div className="flex w-[44px] flex-col">
                  <button
                    type="button"
                    onClick={() => onAdjustDeploymentDecimals(1)}
                    className="h-1/2 min-h-0 rounded-tr-xl border border-l-0 border-[#31416F] bg-[#0B1020] text-base font-bold leading-none text-[#8FA8FF] transition-colors hover:bg-green-500 hover:text-black"
                    title="Increment Decimals"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => onAdjustDeploymentDecimals(-1)}
                    className="h-1/2 min-h-0 rounded-br-xl border border-l-0 border-t-0 border-[#31416F] bg-[#0B1020] text-base font-bold leading-none text-[#8FA8FF] transition-colors hover:bg-green-500 hover:text-black"
                    title="Decrement Decimals"
                  >
                    -
                  </button>
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <span className="text-sm font-semibold text-[#8FA8FF]">Version</span>
              <div className="flex items-stretch">
                <input
                  type="text"
                  inputMode="decimal"
                  maxLength={8}
                  value={deploymentVersion}
                  onChange={(event) => onDeploymentVersionChange(event.target.value)}
                  placeholder="Add optional Version"
                  className="w-[8ch] min-w-[8ch] rounded-l-xl rounded-r-none border border-[#31416F] bg-[#0B1020] px-2 py-2 text-white outline-none transition-colors focus:border-[#8FA8FF]"
                />
                <div className="flex w-[44px] flex-col">
                  <button
                    type="button"
                    onClick={() => onAdjustDeploymentVersion(1)}
                    className="h-1/2 min-h-0 rounded-tr-xl border border-l-0 border-[#31416F] bg-[#0B1020] text-base font-bold leading-none text-[#8FA8FF] transition-colors hover:bg-green-500 hover:text-black"
                    title="Increment Contract Version"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => onAdjustDeploymentVersion(-1)}
                    className="h-1/2 min-h-0 rounded-br-xl border border-l-0 border-t-0 border-[#31416F] bg-[#0B1020] text-base font-bold leading-none text-[#8FA8FF] transition-colors hover:bg-green-500 hover:text-black"
                    title="Decrement Contract Version"
                  >
                    -
                  </button>
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
          <div
            className={isDeployDisabled ? 'group inline-flex md:justify-self-start' : 'inline-flex md:justify-self-start'}
            title={
              isDeployDisabled
                ? `Deploy disabled: ${deployDisableReason}`
                : 'Deploy'
            }
          >
            <button
              type="button"
              disabled={isDeployDisabled}
              onClick={() => void onDeploy()}
              className={`rounded-xl px-4 py-[0.45rem] font-semibold text-black transition-colors ${
                isDeployDisabled
                  ? 'pointer-events-none cursor-not-allowed bg-[#7a7a7a] group-hover:bg-red-600'
                  : deploymentFlashError
                  ? 'bg-red-500 hover:bg-red-400'
                  : 'bg-[#EBCA6A] hover:bg-[#F4D883]'
              }`}
            >
              {deployButtonLabel}
            </button>
          </div>
          <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
            <span className="text-sm font-semibold text-[#8FA8FF]">Network Name</span>
            <input
              type="text"
              value={deploymentChainName}
              readOnly
              className="w-full rounded-xl border border-[#31416F] bg-[#0B1020] px-4 py-2 text-slate-300 outline-none"
            />
          </label>
          <label className="grid items-center gap-3 md:grid-cols-[auto_auto] justify-self-end">
            <span className="text-right text-sm font-semibold text-[#8FA8FF]">Chain Id</span>
            <input
              type="text"
              value={deploymentChainId}
              readOnly
              className="w-[8ch] min-w-[8ch] rounded-xl border border-[#31416F] bg-[#0B1020] px-2 py-2 text-center text-slate-300 outline-none"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
          <div className="flex items-center gap-3 md:justify-self-start">
            <span className="shrink-0 text-sm font-semibold text-[#8FA8FF]">Hardhat Deployment Account Number</span>
            <div className="flex items-stretch">
              <select
                value={hardhatDeploymentAccountNumber}
                onChange={(event) => onHardhatDeploymentAccountNumberChange(event.target.value)}
                className="w-[6ch] min-w-[6ch] rounded-l-xl rounded-r-none border border-[#31416F] bg-[#0B1020] px-2 py-2 text-right text-sm text-white outline-none transition-colors focus:border-[#8FA8FF]"
                aria-label="Hardhat Deployment Account Number"
                title="Hardhat Deployment Account Number"
              >
                {Array.from({ length: 20 }, (_, idx) => (
                  <option key={`hardhat-deploy-account-${idx}`} value={idx}>
                    {idx}
                  </option>
                ))}
              </select>
              <div className="flex w-[38px] flex-col">
                <button
                  type="button"
                  onClick={() => {
                    if (canIncrementHardhatDeploymentAccountNumber) onAdjustHardhatDeploymentAccountNumber(1);
                  }}
                  className={`h-1/2 min-h-0 rounded-tr-xl border border-l-0 border-[#31416F] bg-[#0B1020] text-sm font-bold leading-none text-[#8FA8FF] transition-colors hover:text-black ${
                    canIncrementHardhatDeploymentAccountNumber
                      ? 'cursor-pointer hover:bg-green-500'
                      : 'cursor-not-allowed hover:bg-red-500'
                  }`}
                  title="Increment Hardhat Deployment Account Number"
                  aria-disabled={!canIncrementHardhatDeploymentAccountNumber}
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (canDecrementHardhatDeploymentAccountNumber) onAdjustHardhatDeploymentAccountNumber(-1);
                  }}
                  className={`h-1/2 min-h-0 rounded-br-xl border border-l-0 border-t-0 border-[#31416F] bg-[#0B1020] text-sm font-bold leading-none text-[#8FA8FF] transition-colors hover:text-black ${
                    canDecrementHardhatDeploymentAccountNumber
                      ? 'cursor-pointer hover:bg-green-500'
                      : 'cursor-not-allowed hover:bg-red-500'
                  }`}
                  title="Decrement Hardhat Deployment Account Number"
                  aria-disabled={!canDecrementHardhatDeploymentAccountNumber}
                >
                  -
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(260px,1fr)] md:items-end">
          <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
            <span className="text-sm font-semibold text-[#8FA8FF]">Local Source Deployment Path</span>
            <input
              type="text"
              value={deploymentPathDisplayValue}
              onChange={(event) => onLocalSourceDeploymentPathChange(event.target.value)}
              readOnly={deploymentMode === 'mocked'}
              className={`w-full rounded-xl border px-4 py-2 text-white outline-none transition-colors ${
                deploymentMode === 'mocked'
                  ? 'border-[#31416F] bg-[#0B1020]/70'
                  : 'border-[#31416F] bg-[#0B1020] focus:border-[#8FA8FF]'
              }`}
              title="Enter local source deployment path"
            />
          </label>
          <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
            <label htmlFor="spcoin-logo-path" className="text-sm font-semibold text-[#8FA8FF]">
              spCoin Logo
            </label>
            <input
              id="spcoin-logo-path"
              aria-label="spCoin Logo"
              type="text"
              value={deploymentLogoPath}
              onChange={(event) => onDeploymentLogoPathChange(event.target.value)}
              className="w-full rounded-xl border border-[#31416F] bg-[#0B1020] px-4 py-2 text-white outline-none transition-colors focus:border-[#8FA8FF]"
            />
          </div>
        </div>

        <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
          <span className="text-sm font-semibold text-[#8FA8FF]">Signer Key</span>
          <label className="block">
            <input
              type="text"
              value={deploymentAccountPrivateKey}
              onChange={(event) => onDeploymentPrivateKeyChange(event.target.value)}
              onBlur={onDeploymentPrivateKeyBlur}
              placeholder={deploymentKeyRequiredMessage}
              className="w-full rounded-xl border border-[#31416F] bg-[#0B1020] px-4 py-2 text-white outline-none transition-colors focus:border-[#8FA8FF]"
            />
          </label>
        </div>

        <div className="flex flex-col gap-4">
          <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
            <span className="text-sm font-semibold text-[#8FA8FF]">{`${deploymentVersionPrefix} Public Key`}</span>
            <input
              type="text"
              value={deploymentPublicKey}
              readOnly
              placeholder="Public Key, Returned from Deployment"
              className="w-full rounded-xl border border-[#31416F] bg-[#0B1020] px-4 py-2 text-slate-300 outline-none"
            />
          </label>

        </div>

        <div>
          <span className="mb-2 block text-sm font-semibold text-[#8FA8FF]">Status</span>
          <div className="rounded-xl border border-dashed border-[#31416F] bg-[#0B1020] p-4 text-sm text-slate-300">
            <DeploymentStatusBlock
              deploymentStatus={deploymentStatus}
              deploymentStatusIsError={deploymentStatusIsError}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
