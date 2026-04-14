// File: app/(menu)/(dynamic)/SpCoinAccessController/components/DeploymentControllerPanel.tsx
import React from 'react';
import Image from 'next/image';
import OpenCloseBtn from '@/components/views/Buttons/OpenCloseBtn';
import WalletAccountSelection, {
  type WalletAccountSelectionValue,
} from '@/components/views/Buttons/WalletAccountSelection';
import { DeploymentStatusBlock } from './StatusBlocks';

type DeploymentControllerPanelProps = {
  cardClass: string;
  deploymentName: string;
  deploymentSymbol: string;
  deploymentDecimals: string;
  deploymentVersion: string;
  deploymentSignerSource: 'ec2-base' | 'metamask';
  deploymentWalletSelection: WalletAccountSelectionValue;
  deploymentChainName: string;
  deploymentChainId: string;
  deploymentPathDisplayValue: string;
  selectedSignerAddress: string;
  showDeploymentAccountDetails: boolean;
  onToggleDeploymentAccountDetails: () => void;
  deploymentAccountMetadata?: {
    logoURL?: string;
    name?: string;
    symbol?: string;
  };
  deploymentFlashError: boolean;
  deploymentPrivateKey: string;
  deploymentKeyRequiredMessage: string;
  deploymentVersionPrefix: string;
  deployedContractAddress: string;
  showDeployedSignerDetails: boolean;
  onToggleDeployedSignerDetails: () => void;
  deployedSignerAddress: string;
  deployedSignerMetadata?: {
    logoURL?: string;
    name?: string;
    symbol?: string;
  };
  deploymentStatus: string;
  deploymentStatusIsError: boolean;
  deployDisableReason: string;
  deployButtonLabel: string;
  isGeneratingAbi: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDeploymentWalletSelectionChange: (next: WalletAccountSelectionValue) => void;
  onDeploymentSignerAddressChange: (value: string) => void;
  onDeploymentNameChange: (value: string) => void;
  onDeploymentSymbolChange: (value: string) => void;
  onDeploymentDecimalsChange: (value: string) => void;
  onAdjustDeploymentDecimals: (direction: 1 | -1) => void;
  onDeploymentVersionChange: (value: string) => void;
  onAdjustDeploymentVersion: (direction: 1 | -1) => void;
  onLocalSourceDeploymentPathChange: (value: string) => void;
  onDeploy: () => Promise<void>;
  onGenerateAbi: () => Promise<void>;
  onDeploymentPrivateKeyChange: (value: string) => void;
  onDeploymentPrivateKeyBlur: () => void;
};

export default function DeploymentControllerPanel(props: DeploymentControllerPanelProps) {
  const {
    cardClass,
    deploymentName,
    deploymentSymbol,
    deploymentDecimals,
    deploymentVersion,
    deploymentSignerSource,
    deploymentWalletSelection,
    deploymentChainName,
    deploymentChainId,
    deploymentPathDisplayValue,
    selectedSignerAddress,
    showDeploymentAccountDetails,
    onToggleDeploymentAccountDetails,
    deploymentAccountMetadata,
    deploymentFlashError,
    deploymentPrivateKey,
    deploymentVersionPrefix,
    deployedContractAddress,
    showDeployedSignerDetails,
    onToggleDeployedSignerDetails,
    deployedSignerAddress,
    deployedSignerMetadata,
    deploymentStatus,
    deploymentStatusIsError,
    deployDisableReason,
    deployButtonLabel,
    isGeneratingAbi,
    isExpanded,
    onToggleExpand,
    onDeploymentWalletSelectionChange,
    onDeploymentSignerAddressChange,
    onDeploymentNameChange,
    onDeploymentSymbolChange,
    onDeploymentDecimalsChange,
    onAdjustDeploymentDecimals,
    onDeploymentVersionChange,
    onAdjustDeploymentVersion,
    onLocalSourceDeploymentPathChange,
    onDeploy,
    onGenerateAbi,
  } = props;
  const isDeployDisabled = deployDisableReason !== 'ENABLED';
  const isDeploymentInProgress = deployDisableReason === 'DEPLOYMENT_IN_PROGRESS';
  const isGenerateAbiDisabled = isGeneratingAbi || isDeploymentInProgress;
  const isHardhatSelected = deploymentWalletSelection.source === 'ec2-base';
  const signerPublicKeyPlaceholder =
    deploymentSignerSource === 'metamask'
      ? 'Connected MetaMask wallet address'
      : 'Derived from Hardhat deployment account';
  const deployedSignerFieldLabel =
    deploymentSignerSource === 'metamask' ? 'Signer Address' : 'Signer Key';
  const deployedSignerFieldPlaceholder =
    deploymentSignerSource === 'metamask'
      ? 'Signer address used for deployment'
      : 'Signer Key, Used for Deployment';
  const deployedSignerKeyValue =
    deployedContractAddress
      ? deploymentSignerSource === 'metamask'
        ? selectedSignerAddress
        : deploymentPrivateKey
      : '';
  const accountInfoLabelClassName =
    'w-fit text-left text-sm font-semibold text-[#8FA8FF] transition-colors hover:text-white';
  void cardClass;

  return (
    <div className="scrollbar-hide flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden rounded-2xl bg-[#192134] p-4">
      <div
        className="relative"
        onDoubleClick={onToggleExpand}
        title={isExpanded ? 'Double-click to return to shared view' : 'Double-click to expand'}
      >
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 pb-[0.32rem]">
          <div className="flex min-h-10 items-center" />
          <div className="min-w-0 justify-self-center text-center">
            <h2 className="text-center text-xl font-semibold text-[#8FA8FF]">Sponsor Coin Contract Deployment</h2>
          </div>
          <div className="flex shrink-0 items-center justify-self-end gap-2" onDoubleClick={(event) => event.stopPropagation()}>
            <OpenCloseBtn
              onClick={onToggleExpand}
              onDoubleClick={(event) => event.stopPropagation()}
              isExpanded={isExpanded}
              className="relative -right-[9px] -top-[10px]"
            />
          </div>
        </div>
      </div>

      <div className="scrollbar-hide grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto pr-2">
        <section className="rounded-xl border border-[#31416F] bg-[#0B1220] p-4">
          <WalletAccountSelection
            showHardhatAccountSelector={deploymentWalletSelection.source === 'ec2-base'}
            hardhatSignerAvailable
            hardhatDeploymentAccountCount={20}
            disabled={isDeploymentInProgress}
            value={deploymentWalletSelection}
            onChange={onDeploymentWalletSelectionChange}
          />

            <div className="mt-4 grid gap-4">
              <div
                className={`grid grid-cols-1 gap-3${
                  showDeploymentAccountDetails ? ' rounded-xl border border-[#31416F] bg-[#0B1220] p-3' : ''
                }`}
              >
                <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                  <button
                    type="button"
                  disabled={isDeploymentInProgress}
                  onClick={onToggleDeploymentAccountDetails}
                  className={accountInfoLabelClassName}
                  title="Toggle deployment account details"
                >
                  Owner
                </button>
                <input
                  type="text"
                  value={selectedSignerAddress}
                  onChange={(event) => onDeploymentSignerAddressChange(event.target.value)}
                  readOnly={deploymentSignerSource !== 'metamask' || isDeploymentInProgress}
                  placeholder={signerPublicKeyPlaceholder}
                  className="w-full rounded-xl border border-[#31416F] bg-[#0B1020] px-4 py-2 text-slate-300 outline-none transition-colors focus:border-[#8FA8FF]"
                />
              </label>
              {showDeploymentAccountDetails ? (
                <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                  <span className="text-sm font-semibold text-[#8FA8FF]">Metadata</span>
                  <div className="flex items-center gap-3 rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[#11162A]">
                      {deploymentAccountMetadata?.logoURL ? (
                        <Image
                          src={deploymentAccountMetadata.logoURL}
                          alt={deploymentAccountMetadata?.name || 'Deployment account'}
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
                      <div className="truncate font-medium text-white">
                        {deploymentAccountMetadata?.name || 'Unnamed account'}
                      </div>
                      <div className="truncate text-xs text-slate-400">
                        {deploymentAccountMetadata?.symbol || 'No symbol'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1.16fr)_minmax(0,0.84fr)_auto] md:items-center">
                <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                  <span className="text-sm font-semibold text-[#8FA8FF]">Name</span>
                  <input
                  type="text"
                  value={deploymentName}
                    disabled={isDeploymentInProgress}
                    onChange={(event) => onDeploymentNameChange(event.target.value)}
                    className="w-full rounded-xl border border-[#31416F] bg-[#0B1020] px-4 py-2 text-white outline-none transition-colors focus:border-[#8FA8FF]"
                  />
                </label>
                <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)] md:justify-self-end md:w-full">
                  <span className="text-sm font-semibold text-[#8FA8FF]">Symbol</span>
                  <input
                  type="text"
                  value={deploymentSymbol}
                    disabled={isDeploymentInProgress}
                    onChange={(event) => onDeploymentSymbolChange(event.target.value)}
                    className="w-full rounded-xl border border-[#31416F] bg-[#0B1020] px-4 py-2 text-white outline-none transition-colors focus:border-[#8FA8FF]"
                  />
                </label>
                <label className="flex items-center gap-3 md:justify-self-end">
                  <span className="text-sm font-semibold text-[#8FA8FF]">Decimals</span>
                  <div className="flex items-stretch">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={3}
                      value={deploymentDecimals}
                      disabled={isDeploymentInProgress}
                      onChange={(event) => onDeploymentDecimalsChange(event.target.value)}
                      className="w-[4ch] min-w-[4ch] rounded-l-xl rounded-r-none border border-[#31416F] bg-[#0B1020] px-2 py-2 text-white outline-none transition-colors focus:border-[#8FA8FF]"
                    />
                    <div className="flex w-[26px] flex-col">
                      <button
                        type="button"
                        disabled={isDeploymentInProgress}
                        onClick={() => onAdjustDeploymentDecimals(1)}
                        className="h-1/2 min-h-0 rounded-tr-xl border border-l-0 border-[#31416F] bg-[#0B1020] text-base font-bold leading-none text-[#8FA8FF] transition-colors hover:bg-green-500 hover:text-black"
                        title="Increment Decimals"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        disabled={isDeploymentInProgress}
                        onClick={() => onAdjustDeploymentDecimals(-1)}
                        className="h-1/2 min-h-0 rounded-br-xl border border-l-0 border-t-0 border-[#31416F] bg-[#0B1020] text-base font-bold leading-none text-[#8FA8FF] transition-colors hover:bg-green-500 hover:text-black"
                        title="Decrement Decimals"
                      >
                        -
                      </button>
                    </div>
                  </div>
                </label>
              </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
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
              {isHardhatSelected ? (
                <label className="flex items-center gap-3 justify-self-end">
                  <span className="text-sm font-semibold text-[#8FA8FF]">Version</span>
                  <div className="flex items-stretch">
                    <input
                      type="text"
                      inputMode="decimal"
                      maxLength={8}
                      value={deploymentVersion}
                      disabled={isDeploymentInProgress}
                      onChange={(event) => onDeploymentVersionChange(event.target.value)}
                      placeholder="Add optional Version"
                      className="w-[8ch] min-w-[8ch] rounded-l-xl rounded-r-none border border-[#31416F] bg-[#0B1020] px-2 py-2 text-white outline-none transition-colors focus:border-[#8FA8FF]"
                    />
                    <div className="flex w-[26px] flex-col">
                      <button
                        type="button"
                        disabled={isDeploymentInProgress}
                        onClick={() => onAdjustDeploymentVersion(1)}
                        className="h-1/2 min-h-0 rounded-tr-xl border border-l-0 border-[#31416F] bg-[#0B1020] text-base font-bold leading-none text-[#8FA8FF] transition-colors hover:bg-green-500 hover:text-black"
                        title="Increment Contract Version"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        disabled={isDeploymentInProgress}
                        onClick={() => onAdjustDeploymentVersion(-1)}
                        className="h-1/2 min-h-0 rounded-br-xl border border-l-0 border-t-0 border-[#31416F] bg-[#0B1020] text-base font-bold leading-none text-[#8FA8FF] transition-colors hover:bg-green-500 hover:text-black"
                        title="Decrement Contract Version"
                      >
                        -
                      </button>
                    </div>
                  </div>
                </label>
              ) : null}
            </div>

            {isHardhatSelected ? (
              <div className="grid gap-4 md:grid-cols-[minmax(260px,1fr)] md:items-end">
                <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                  <span className="text-sm font-semibold text-[#8FA8FF]">Deployment Source</span>
                  <input
                    type="text"
                    value={deploymentPathDisplayValue}
                    disabled={isDeploymentInProgress}
                    onChange={(event) => onLocalSourceDeploymentPathChange(event.target.value)}
                    className="w-full rounded-xl border border-[#31416F] bg-[#0B1020] px-4 py-2 text-white outline-none transition-colors focus:border-[#8FA8FF]"
                    title="Enter deployment source"
                  />
                </label>
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2">
              <div
                className={isDeployDisabled ? 'group' : ''}
                title={isDeployDisabled ? `Deploy disabled: ${deployDisableReason}` : 'Deploy'}
              >
                <button
                  type="button"
                  disabled={isDeployDisabled}
                  onClick={() => void onDeploy()}
                  className={`w-full rounded-xl px-4 py-[0.45rem] font-semibold text-black transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    isDeployDisabled
                      ? 'bg-[#EBCA6A] group-hover:bg-red-500'
                      : deploymentFlashError
                      ? 'bg-red-500 hover:bg-red-400'
                      : 'bg-[#EBCA6A] hover:bg-green-500'
                  }`}
                >
                  {deployButtonLabel}
                </button>
              </div>
              <button
                type="button"
                disabled={isGenerateAbiDisabled}
                onClick={() => void onGenerateAbi()}
                className={`w-full rounded-xl px-4 py-[0.45rem] font-semibold text-black transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  isGenerateAbiDisabled
                    ? 'bg-[#5981F3]'
                    : 'bg-[#5981F3] hover:bg-green-500'
                }`}
                title="Generate SPCoin ABI"
              >
                {isGeneratingAbi ? 'Generating ABI...' : 'Generate ABI'}
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[#31416F] bg-[#0B1220] p-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div />
            <h3 className="justify-self-center text-xl font-semibold text-[#8FA8FF]">Deployed Sponsor Coin</h3>
            <div />
          </div>

          <div className="mt-4 flex flex-col gap-4">
            <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
              <span className="text-sm font-semibold text-[#8FA8FF]">{`${deploymentVersionPrefix} Contract Address`}</span>
              <input
                type="text"
                value={deployedContractAddress}
                readOnly
                placeholder="Contract Address, Returned from Deployment"
                className="w-full rounded-xl border border-[#31416F] bg-[#0B1020] px-4 py-2 text-slate-300 outline-none"
              />
            </label>

            <div
              className={`grid grid-cols-1 gap-3${
                showDeployedSignerDetails ? ' rounded-xl border border-[#31416F] bg-[#0B1220] p-3' : ''
              }`}
            >
              <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                <button
                  type="button"
                  disabled={isDeploymentInProgress}
                  onClick={onToggleDeployedSignerDetails}
                  className={accountInfoLabelClassName}
                  title={`Toggle ${deployedSignerFieldLabel.toLowerCase()} details`}
                >
                  {deployedSignerFieldLabel}
                </button>
                <input
                  type="text"
                  value={deployedSignerKeyValue}
                  readOnly
                  placeholder={deployedSignerFieldPlaceholder}
                  className="w-full rounded-xl border border-[#31416F] bg-[#0B1020] px-4 py-2 text-slate-300 outline-none"
                />
              </label>
              {showDeployedSignerDetails ? (
                <>
                  <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                    <span className="text-sm font-semibold text-[#8FA8FF]">Account Address</span>
                    <input
                      type="text"
                      value={deployedSignerAddress}
                      readOnly
                      placeholder="Signer account address"
                      className="w-full rounded-xl border border-[#31416F] bg-[#0B1020] px-4 py-2 text-slate-300 outline-none"
                    />
                  </label>
                  <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                    <span className="text-sm font-semibold text-[#8FA8FF]">Metadata</span>
                    <div className="flex items-center gap-3 rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white">
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[#11162A]">
                        {deployedSignerMetadata?.logoURL ? (
                          <Image
                            src={deployedSignerMetadata.logoURL}
                            alt={deployedSignerMetadata?.name || 'Signer account'}
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
                        <div className="truncate font-medium text-white">
                          {deployedSignerMetadata?.name || 'Unnamed account'}
                        </div>
                        <div className="truncate text-xs text-slate-400">
                          {deployedSignerMetadata?.symbol || 'No symbol'}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
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
        </section>
      </div>
    </div>
  );
}
