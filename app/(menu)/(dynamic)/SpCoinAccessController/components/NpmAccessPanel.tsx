// File: app/(menu)/(dynamic)/SpCoinAccessController/components/NpmAccessPanel.tsx
import React from 'react';
import { NpmStatusBlock } from './StatusBlocks';
import { normalizeProjectRelativePath } from '../helpers';

type FlashTarget = 'download' | 'upload' | null;
type ActiveAction = 'download' | 'upload' | 'install' | null;

type NpmAccessPanelProps = {
  cardClass: string;
  selectedPackage: string;
  availablePackages: string[];
  localInstallSourceRoot: string;
  localInstallSourceRootError: string;
  npmOtp: string;
  versionInput: string;
  activeAction: ActiveAction;
  uploadBlocked: boolean;
  activeDownloadedVersion: string;
  downloadBlocked: boolean;
  flashTarget: FlashTarget;
  selectedVersion: string;
  status: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onPackagePersist: (nextPackage: string) => void;
  onLocalInstallSourceRootChange: (value: string) => void;
  onValidateLocalInstallSourceRoot: (value: string) => boolean;
  onNpmOtpChange: (value: string) => void;
  onVersionInputChange: (value: string) => void;
  onVersionPersist: () => void;
  onAdjustVersion: (direction: 1 | -1) => void;
  onRunManagerAction: (action: 'download' | 'upload' | 'install') => Promise<void>;
};

export default function NpmAccessPanel(props: NpmAccessPanelProps) {
  const {
    cardClass,
    selectedPackage,
    availablePackages,
    localInstallSourceRoot,
    localInstallSourceRootError,
    npmOtp,
    versionInput,
    activeAction,
    uploadBlocked,
    activeDownloadedVersion,
    downloadBlocked,
    flashTarget,
    selectedVersion,
    status,
    isExpanded,
    onToggleExpand,
    onPackagePersist,
    onLocalInstallSourceRootChange,
    onValidateLocalInstallSourceRoot,
    onNpmOtpChange,
    onVersionInputChange,
    onVersionPersist,
    onAdjustVersion,
    onRunManagerAction,
  } = props;
  const hasValidAuthenticatorCode = npmOtp.trim().length === 6;
  const isActiveSelectedVersion =
    String(selectedVersion || '').trim().length > 0 &&
    String(activeDownloadedVersion || '').trim().length > 0 &&
    String(selectedVersion || '').trim() === String(activeDownloadedVersion || '').trim();
  const [isDownloadHovered, setIsDownloadHovered] = React.useState(false);
  const [isUploadHovered, setIsUploadHovered] = React.useState(false);
  const showDownloadActiveVersion = isDownloadHovered && isActiveSelectedVersion;
  const showUploadActiveVersion = isUploadHovered && isActiveSelectedVersion;
  const showUploadVersionExists =
    isUploadHovered && downloadBlocked && !uploadBlocked && !isActiveSelectedVersion;
  const isUploadReady = !uploadBlocked && !isActiveSelectedVersion;
  const showUploadAuthenticatorCodeRequired =
    isUploadHovered && isUploadReady && !showUploadVersionExists && !hasValidAuthenticatorCode;

  return (
    <div className="scrollbar-hide flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden rounded-2xl bg-[#192134] p-4">
      <div
        className="relative mb-4"
        onDoubleClick={onToggleExpand}
        title={isExpanded ? 'Double-click to return to shared view' : 'Double-click to expand'}
      >
        <div className="flex min-h-10 items-center justify-center pr-12">
          <h2 className="text-center text-xl font-semibold text-[#8FA8FF]">NPM Access Controller</h2>
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
        <div className="text-center">
          <h3 className="text-xl font-semibold text-[#8FA8FF]">Node Package Manager</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
          <label htmlFor="npm-package-select" className="text-sm font-semibold text-[#8FA8FF]">
            NPM Package
          </label>
          <select
            id="npm-package-select"
            aria-label="NPM Package"
            value={selectedPackage}
            onChange={(event) => onPackagePersist(event.target.value)}
            className="w-full rounded-xl border border-[#31416F] bg-[#0B1020] px-4 py-2 text-white outline-none transition-colors focus:border-[#8FA8FF]"
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
              className={`w-full rounded-xl border px-4 py-2 text-white outline-none transition-colors ${
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
                  className="w-[8ch] min-w-[8ch] rounded-l-xl rounded-r-none border border-[#31416F] bg-[#0B1020] px-2 py-2 text-white outline-none transition-colors focus:border-[#8FA8FF]"
                />
                <div className="flex w-[26px] flex-col">
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
          <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
            <span className="text-sm font-semibold text-[#8FA8FF]">Authenticator</span>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={npmOtp}
              onChange={(event) => onNpmOtpChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit code from your npm authenticator app"
              className={`w-full rounded-xl border border-[#31416F] px-4 py-2 text-white outline-none transition-colors focus:border-[#8FA8FF] ${
                showUploadAuthenticatorCodeRequired ? 'bg-red-500/25' : 'bg-[#0B1020]'
              }`}
              aria-label="Enter the current 6-digit code from your npm authenticator app"
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <button
            type="button"
            onClick={() => void onRunManagerAction('upload')}
            onMouseEnter={() => setIsUploadHovered(true)}
            onMouseLeave={() => setIsUploadHovered(false)}
            disabled={Boolean(activeAction) || !selectedPackage}
            title={uploadBlocked ? 'Current Version Exists on NPM' : 'Upload selected package to NPM'}
            className={`rounded-xl px-4 py-[0.45rem] font-semibold text-black transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              flashTarget === 'upload'
                ? 'bg-red-500 hover:bg-red-400'
                : showUploadVersionExists
                ? 'bg-[#EBCA6A] hover:bg-red-500'
                : isActiveSelectedVersion
                ? 'bg-[#E5B94F] hover:bg-red-500'
                : uploadBlocked
                ? 'bg-[#E5B94F] hover:bg-red-500'
                : hasValidAuthenticatorCode
                ? 'bg-[#EBCA6A] hover:bg-green-500'
                : 'bg-[#EBCA6A] hover:bg-red-500'
            }`}
          >
            {showUploadVersionExists
              ? `Version ${selectedVersion} Exists on NPM`
              : showUploadActiveVersion
              ? 'UpLoad Active Version Disabled'
              : showUploadAuthenticatorCodeRequired
              ? 'Authenticator Code Required'
              : activeAction === 'upload'
              ? 'Working...'
              : isActiveSelectedVersion
              ? 'Upload Disabled'
              : downloadBlocked
              ? 'Upload Disabled'
              : uploadBlocked
              ? 'Upload Disabled'
              : 'Upload To NPM Manager'}
          </button>
          <button
            type="button"
            onClick={() => void onRunManagerAction('download')}
            onMouseEnter={() => setIsDownloadHovered(true)}
            onMouseLeave={() => setIsDownloadHovered(false)}
            disabled={Boolean(activeAction) || !selectedPackage}
            title={downloadBlocked ? 'Revert local package from backup archive' : 'Download selected package from NPM'}
            className={`rounded-xl px-4 py-[0.45rem] font-semibold text-black transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              flashTarget === 'download'
                ? 'bg-red-500 hover:bg-red-400'
                : isActiveSelectedVersion
                ? 'bg-[#5981F3] hover:bg-red-500'
                : downloadBlocked
                ? 'bg-[#E5B94F] hover:bg-red-500'
                : 'bg-[#5981F3] hover:bg-green-500'
            }`}
          >
            {showDownloadActiveVersion
              ? 'DownLoad Active Version Disabled'
              : activeAction === 'download'
              ? 'Working...'
              : isActiveSelectedVersion
              ? 'DownLoad Disabled'
              : downloadBlocked
              ? `Revert Version ${selectedVersion}`
              : 'Download From NPM Manager'}
          </button>
          <button
            type="button"
            onClick={() => void onRunManagerAction('install')}
            disabled={Boolean(activeAction) || !selectedPackage}
            title="Install selected package version into node_modules"
            className="rounded-xl bg-[#5981F3] px-4 py-[0.45rem] font-semibold text-black transition-colors hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {activeAction === 'install' ? 'Working...' : 'Install To node_modules'}
          </button>
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
