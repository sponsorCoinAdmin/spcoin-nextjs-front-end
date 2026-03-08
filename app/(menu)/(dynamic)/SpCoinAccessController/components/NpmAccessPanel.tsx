// File: app/(menu)/(dynamic)/SpCoinAccessController/components/NpmAccessPanel.tsx
import React from 'react';
import { NpmStatusBlock } from './StatusBlocks';
import { normalizeProjectRelativePath } from '../helpers';

type FlashTarget = 'download' | 'upload' | null;
type ActiveAction = 'download' | 'upload' | null;

type NpmAccessPanelProps = {
  cardClass: string;
  selectedPackage: string;
  availablePackages: string[];
  useLocalPackage: boolean;
  localInstallSourceRoot: string;
  localInstallSourceRootError: string;
  versionInput: string;
  activeAction: ActiveAction;
  uploadBlocked: boolean;
  downloadBlocked: boolean;
  flashTarget: FlashTarget;
  selectedVersion: string;
  sourceRoot: string;
  status: string;
  onPackagePersist: (nextPackage: string) => void;
  onPackageSourceModeChange: (mode: 'local' | 'node_modules') => Promise<void>;
  onLocalInstallSourceRootChange: (value: string) => void;
  onValidateLocalInstallSourceRoot: (value: string) => boolean;
  onVersionInputChange: (value: string) => void;
  onVersionPersist: () => void;
  onAdjustVersion: (direction: 1 | -1) => void;
  onRunManagerAction: (action: 'download' | 'upload') => Promise<void>;
  onSourceRootChange: (value: string) => void;
  onSourceRootBlurNormalize: (value: string) => void;
};

export default function NpmAccessPanel(props: NpmAccessPanelProps) {
  const {
    cardClass,
    selectedPackage,
    availablePackages,
    useLocalPackage,
    localInstallSourceRoot,
    localInstallSourceRootError,
    versionInput,
    activeAction,
    uploadBlocked,
    downloadBlocked,
    flashTarget,
    selectedVersion,
    sourceRoot,
    status,
    onPackagePersist,
    onPackageSourceModeChange,
    onLocalInstallSourceRootChange,
    onValidateLocalInstallSourceRoot,
    onVersionInputChange,
    onVersionPersist,
    onAdjustVersion,
    onRunManagerAction,
    onSourceRootChange,
    onSourceRootBlurNormalize,
  } = props;

  return (
    <div className="scrollbar-hide flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden rounded-2xl bg-[#192134] p-4">
      <div className="mb-4 flex items-center justify-center border-b border-slate-700 pb-3">
        <h2 className="text-center text-xl font-semibold text-[#8FA8FF]">NPM Access Controller</h2>
      </div>

      <div className={`${cardClass} scrollbar-hide flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-2`}>
        <div className="text-center">
          <h3 className="text-xl font-semibold text-[#8FA8FF]">Node Package Manager</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
          <label htmlFor="npm-package-select" className="text-sm font-semibold text-[#8FA8FF]">
            NPM Package
          </label>
          <select
            id="npm-package-select"
            aria-label="NPM Package"
            value={selectedPackage}
            onChange={(event) => onPackagePersist(event.target.value)}
            className="w-full rounded-xl border border-[#31416F] bg-[#0B1020] px-4 py-3 text-white outline-none transition-colors focus:border-[#8FA8FF]"
          >
            {availablePackages.length > 0 ? (
              availablePackages.map((packageName) => (
                <option key={packageName} value={packageName}>
                  {packageName}
                </option>
              ))
            ) : (
              <option value={selectedPackage}>{selectedPackage}</option>
            )}
          </select>
          <div className="mr-[10px] flex items-center justify-end gap-4 text-sm">
            <label className="flex items-center gap-2 text-[#8FA8FF]">
              <input
                type="radio"
                name="package-source-mode"
                value="local"
                checked={useLocalPackage}
                onChange={() => void onPackageSourceModeChange('local')}
                className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
              />
              <span>Local</span>
            </label>
            <label className="flex items-center gap-2 text-[#8FA8FF]">
              <input
                type="radio"
                name="package-source-mode"
                value="node_modules"
                checked={!useLocalPackage}
                onChange={() => void onPackageSourceModeChange('node_modules')}
                className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
              />
              <span>node_modules</span>
            </label>
          </div>
        </div>

        <div className="grid gap-2">
          <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto]">
            <span className="text-sm font-semibold text-[#8FA8FF]">Local Source Install Path</span>
            <input
              type="text"
              value={localInstallSourceRoot}
              onChange={(event) => {
                onLocalInstallSourceRootChange(event.target.value);
                if (localInstallSourceRootError) {
                  onValidateLocalInstallSourceRoot(event.target.value);
                }
              }}
              onBlur={(event) => {
                const normalized = normalizeProjectRelativePath(event.target.value, '/spCoinAccess');
                onLocalInstallSourceRootChange(normalized);
                if (!onValidateLocalInstallSourceRoot(normalized)) {
                  window.alert('Path Not found');
                }
              }}
              className={`w-full rounded-xl border px-4 py-3 text-white outline-none transition-colors ${
                localInstallSourceRootError
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-[#31416F] bg-[#0B1020] focus:border-[#8FA8FF]'
              }`}
              title="Enter local source install path"
            />
            <label className="flex items-center gap-3">
              <span className="text-sm font-semibold text-[#8FA8FF]">Version</span>
              <div className="flex items-stretch">
                <input
                  type="text"
                  inputMode="decimal"
                  value={versionInput}
                  onChange={(event) => onVersionInputChange(event.target.value)}
                  onBlur={onVersionPersist}
                  placeholder="0.0.1"
                  className="w-[8ch] min-w-[8ch] rounded-l-xl rounded-r-none border border-[#31416F] bg-[#0B1020] px-2 py-3 text-white outline-none transition-colors focus:border-[#8FA8FF]"
                />
                <div className="flex w-[44px] flex-col">
                  <button
                    type="button"
                    onClick={() => onAdjustVersion(1)}
                    className="h-1/2 min-h-0 rounded-tr-xl border border-l-0 border-[#31416F] bg-[#0B1020] text-base font-bold leading-none text-[#8FA8FF] transition-colors hover:bg-green-500 hover:text-black"
                    title="Increment Version"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => onAdjustVersion(-1)}
                    className="h-1/2 min-h-0 rounded-br-xl border border-l-0 border-t-0 border-[#31416F] bg-[#0B1020] text-base font-bold leading-none text-[#8FA8FF] transition-colors hover:bg-green-500 hover:text-black"
                    title="Decrement Version"
                  >
                    -
                  </button>
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => void onRunManagerAction('upload')}
            disabled={Boolean(activeAction) || !selectedPackage}
            title={uploadBlocked ? 'Current Version Exists on NPM' : 'Upload selected package to NPM'}
            className={`rounded-xl px-4 py-[0.45rem] font-semibold text-black transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              flashTarget === 'upload'
                ? 'bg-red-500 hover:bg-red-400'
                : uploadBlocked
                ? 'bg-[#E5B94F] hover:bg-[#E5B94F]'
                : 'bg-[#EBCA6A] hover:bg-[#F4D883]'
            }`}
          >
            {activeAction === 'upload' ? 'Working...' : uploadBlocked ? 'Upload Disabled' : 'Upload To NPM Manager'}
          </button>
          <button
            type="button"
            onClick={() => void onRunManagerAction('download')}
            disabled={Boolean(activeAction) || !selectedPackage}
            title={downloadBlocked ? 'Revert local package from backup archive' : 'Download selected package from NPM'}
            className={`rounded-xl px-4 py-[0.45rem] font-semibold text-black transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              flashTarget === 'download'
                ? 'bg-red-500 hover:bg-red-400'
                : downloadBlocked
                ? 'bg-[#E5B94F] hover:bg-[#E5B94F]'
                : 'bg-[#5981F3] hover:bg-[#7C9CFF]'
            }`}
          >
            {activeAction === 'download'
              ? 'Working...'
              : downloadBlocked
              ? `Revert Version ${selectedVersion}`
              : 'Download From NPM Manager'}
          </button>
        </div>
        <div>
          <label className="mt-3 grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
            <span className="text-sm font-semibold text-[#8FA8FF]">Source Root</span>
            <input
              type="text"
              value={sourceRoot}
              onChange={(event) => onSourceRootChange(event.target.value)}
              onBlur={(event) => onSourceRootBlurNormalize(event.target.value)}
              className="w-full rounded-xl border border-[#31416F] bg-[#0B1020] px-4 py-3 text-white outline-none transition-colors focus:border-[#8FA8FF]"
              title="Enter source root relative to the app location"
            />
          </label>
        </div>
        <div>
          <span className="mb-2 block text-sm font-semibold text-[#8FA8FF]">Status</span>
          <div className="rounded-xl border border-dashed border-[#31416F] bg-[#0B1020] p-4 text-sm text-slate-300">
            <NpmStatusBlock status={status} />
          </div>
        </div>
      </div>
    </div>
  );
}
