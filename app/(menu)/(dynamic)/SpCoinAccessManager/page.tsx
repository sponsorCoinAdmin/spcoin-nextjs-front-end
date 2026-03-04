'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import CloseButton from '@/components/views/Buttons/CloseButton';
import { useSettings } from '@/lib/context/hooks/ExchangeContext/nested/useSettings';

type ManagerResponse = {
  ok: boolean;
  message?: string;
  packages?: string[];
  packageName?: string;
  workspaceRoot?: string;
  mode?: 'local' | 'node_modules';
  version?: string;
  downloadBlocked?: boolean;
  uploadBlocked?: boolean;
};

export default function SpCoinAccessManagerPage() {
  const router = useRouter();
  const [settings, setSettings] = useSettings();
  const [chromeHeight, setChromeHeight] = useState(72);
  const managerSettings = settings.spCoinAccessManager ?? {
    useLocalPackage: true,
    selectedVersion: 'latest',
    selectedPackage: '@sponsorcoin/spcoin-access-modules',
  };
  const [versionInput, setVersionInput] = useState(managerSettings.selectedVersion || 'latest');
  const [status, setStatus] = useState<string>(
    'Select a SponsorCoin package, version, and source mode before running download or upload.',
  );
  const [availablePackages, setAvailablePackages] = useState<string[]>([]);
  const [selectedPackage, setSelectedPackage] = useState(
    managerSettings.selectedPackage || '@sponsorcoin/spcoin-access-modules',
  );
  const [deploymentStatus, setDeploymentStatus] = useState(
    'Enter your private spCoin deployment values, then use Deploy once the server-side contract automation is connected.',
  );
  const [deploymentName, setDeploymentName] = useState('sPCoin');
  const [deploymentVersion, setDeploymentVersion] = useState('0.0.1');
  const [downloadBlocked, setDownloadBlocked] = useState(false);
  const [uploadBlocked, setUploadBlocked] = useState(true);
  const [flashTarget, setFlashTarget] = useState<'download' | 'upload' | null>(null);
  const [activeAction, setActiveAction] = useState<'download' | 'upload' | null>(null);

  const cardClass =
    'rounded-2xl border border-[#2B3A67] bg-[#11162A] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.25)]';
  const currentSourceLabel = managerSettings.useLocalPackage
    ? 'Local /spCoinAccess/spCoinNpmSource'
    : 'node_modules';

  const selectedVersion = useMemo(() => {
    const trimmed = versionInput.trim();
    return trimmed || 'latest';
  }, [versionInput]);

  const sanitizeVersionInput = (value: string) => value.replace(/[^0-9.]/g, '');

  const handleDeploy = () => {
    const normalizedName = deploymentName.trim() || 'sPCoin';
    const normalizedVersion = deploymentVersion.trim() || 'latest';

    setDeploymentStatus(
      `Deployment scaffold prepared for ${normalizedName} (${normalizedVersion}). Server-side deployment automation is not connected yet.`,
    );
  };

  const adjustDeploymentVersion = (direction: 1 | -1) => {
    const sanitized = sanitizeVersionInput(deploymentVersion).replace(/^\.+|\.+$/g, '');
    const segments = sanitized
      .split('.')
      .filter(Boolean)
      .map((segment) => Number.parseInt(segment, 10))
      .filter((segment) => Number.isFinite(segment) && segment >= 0);

    const nextSegments = segments.length > 0 ? [...segments] : [0, 0, 0];
    const lastIndex = nextSegments.length - 1;
    const nextValue = Math.max(0, (nextSegments[lastIndex] ?? 0) + direction);
    nextSegments[lastIndex] = nextValue;

    setDeploymentVersion(nextSegments.join('.'));
  };

  const adjustVersion = (direction: 1 | -1) => {
    const sanitized = sanitizeVersionInput(versionInput).replace(/^\.+|\.+$/g, '');
    const segments = sanitized
      .split('.')
      .filter(Boolean)
      .map((segment) => Number.parseInt(segment, 10))
      .filter((segment) => Number.isFinite(segment) && segment >= 0);

    const nextSegments = segments.length > 0 ? [...segments] : [0, 0, 0];
    const lastIndex = nextSegments.length - 1;
    const nextValue = Math.max(0, (nextSegments[lastIndex] ?? 0) + direction);
    nextSegments[lastIndex] = nextValue;

    const nextVersion = nextSegments.join('.');
    setVersionInput(nextVersion);
    persistManagerSettings({
      useLocalPackage: managerSettings.useLocalPackage,
      selectedVersion: nextVersion,
      selectedPackage,
    });
  };

  const persistManagerSettings = (next: {
    useLocalPackage: boolean;
    selectedVersion: string;
    selectedPackage: string;
  }) => {
    setSettings((prev) => ({
      ...prev,
      spCoinAccessManager: next,
    }));
  };

  const applyResolvedVersion = (nextVersion: string) => {
    const normalized = String(nextVersion || '').trim();
    if (!normalized) return;
    setVersionInput(normalized);
    persistManagerSettings({
      useLocalPackage: managerSettings.useLocalPackage,
      selectedVersion: normalized,
      selectedPackage,
    });
  };

  useEffect(() => {
    const measure = () => {
      const header = document.querySelector('header');
      const footer = document.querySelector('footer');
      const headerHeight = header instanceof HTMLElement ? header.offsetHeight : 72;
      const footerHeight = footer instanceof HTMLElement ? footer.offsetHeight : 0;
      const next = Math.max(72, headerHeight + footerHeight);
      setChromeHeight(next);
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    let active = true;

    const loadPackages = async () => {
      try {
        const response = await fetch('/api/spCoin/access-manager', { method: 'GET' });
        const data = (await response.json()) as ManagerResponse;
        const packages = Array.isArray(data.packages) ? data.packages : [];
        if (!active) return;
        setAvailablePackages(packages);

        if (packages.length === 0) {
          setStatus('No @sponsorcoin packages were found in node_modules.');
          return;
        }

        const nextSelected = packages.includes(selectedPackage) ? selectedPackage : packages[0];
        setSelectedPackage(nextSelected);
        persistManagerSettings({
          useLocalPackage: managerSettings.useLocalPackage,
          selectedVersion,
          selectedPackage: nextSelected,
        });
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Unknown package discovery failure';
        setStatus(`Failed to load package list: ${message}`);
      }
    };

    void loadPackages();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const refreshState = async () => {
      if (!selectedPackage) return;
      try {
        const params = new URLSearchParams({
          packageName: selectedPackage,
          version: selectedVersion,
        });
        const response = await fetch(`/api/spCoin/access-manager?${params.toString()}`, {
          method: 'GET',
        });
        const data = (await response.json()) as ManagerResponse;
        if (!active) return;
        setDownloadBlocked(Boolean(data.downloadBlocked));
        setUploadBlocked(Boolean(data.uploadBlocked));
      } catch {
        if (!active) return;
        setDownloadBlocked(false);
        setUploadBlocked(true);
      }
    };

    void refreshState();
    return () => {
      active = false;
    };
  }, [selectedPackage, selectedVersion]);

  useEffect(() => {
    if (!flashTarget) return;
    const timeoutId = window.setTimeout(() => setFlashTarget(null), 450);
    return () => window.clearTimeout(timeoutId);
  }, [flashTarget]);

  const handleSourceToggle = () => {
    persistManagerSettings({
      useLocalPackage: !managerSettings.useLocalPackage,
      selectedVersion,
      selectedPackage,
    });
    setStatus(
      `Active package source set to ${!managerSettings.useLocalPackage ? 'Local /spCoinAccess/spCoinNpmSource' : 'node_modules'}.`,
    );
  };

  const handleVersionPersist = () => {
    persistManagerSettings({
      useLocalPackage: managerSettings.useLocalPackage,
      selectedVersion,
      selectedPackage,
    });
  };

  const handlePackagePersist = (nextPackage: string) => {
    setSelectedPackage(nextPackage);
    persistManagerSettings({
      useLocalPackage: managerSettings.useLocalPackage,
      selectedVersion,
      selectedPackage: nextPackage,
    });
  };

  const triggerBlockedFlash = (target: 'download' | 'upload') => {
    setFlashTarget(target);
  };

  const runManagerAction = async (action: 'download' | 'upload') => {
    if (action === 'download' && downloadBlocked) {
      triggerBlockedFlash('download');
      return;
    }

    if (action === 'upload' && uploadBlocked) {
      triggerBlockedFlash('upload');
      return;
    }

    setActiveAction(action);
    setStatus(`${action === 'upload' ? 'Upload' : 'Download'} request queued for ${selectedPackage}...`);

    try {
      const response = await fetch('/api/spCoin/access-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          mode: managerSettings.useLocalPackage ? 'local' : 'node_modules',
          version: selectedVersion,
          packageName: selectedPackage,
        }),
      });

      const data = (await response.json()) as ManagerResponse;
      if (data.version) {
        applyResolvedVersion(data.version);
      }
      if (typeof data.downloadBlocked === 'boolean') {
        setDownloadBlocked(data.downloadBlocked);
      }
      if (typeof data.uploadBlocked === 'boolean') {
        setUploadBlocked(data.uploadBlocked);
      }
      setStatus(data.message ?? 'No response message returned.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown request failure';
      setStatus(`Request failed: ${message}`);
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <main
      className="relative box-border flex w-full flex-col overflow-hidden bg-[#0B1020] px-6 pt-6 text-white"
      style={{ height: `calc(100dvh - ${chromeHeight}px)` }}
    >
      <div className="mb-6 grid grid-cols-[1fr_auto_1fr] items-center">
        <div />
        <h1 className="text-center text-2xl font-bold text-[#5981F3]">SpCoin Access Controller</h1>
        <div className="flex items-center justify-self-end gap-2">
          <CloseButton
            id="spCoinAccessManagerBackButton"
            closeCallback={() => router.back()}
            title="Go Back"
            ariaLabel="Go Back"
            className="h-10 w-10 rounded-full bg-[#243056] text-3xl leading-none text-[#5981F3] flex items-center justify-center transition-colors hover:bg-[#5981F3] hover:text-[#243056]"
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 w-full flex-col gap-6">
        <section className="min-h-0 flex-1 overflow-hidden bg-[#EBCA6A]">
          <div className="flex h-full min-h-0 flex-1 overflow-hidden flex-col gap-6 md:flex-row">
            <div className="scrollbar-hide flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden rounded-2xl bg-[#192134] p-4">
              <div className="mb-4 flex items-center justify-center border-b border-slate-700 pb-3">
                <h2 className="text-center text-xl font-semibold text-[#8FA8FF]">SpCoin Access NPM Controller</h2>
              </div>

              <div className={`${cardClass} scrollbar-hide flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-2`}>
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-[#8FA8FF]">Node Package Manager</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#8FA8FF]">Package</span>
                    <select
                      value={selectedPackage}
                      onChange={(event) => handlePackagePersist(event.target.value)}
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
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#8FA8FF]">npm Version</span>
                    <div className="flex h-[50px] items-stretch">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={versionInput}
                        onChange={(event) => setVersionInput(sanitizeVersionInput(event.target.value))}
                        onBlur={handleVersionPersist}
                        placeholder="0.0.1"
                        className="w-full rounded-l-xl rounded-r-none border border-[#31416F] bg-[#0B1020] px-4 py-3 text-white outline-none transition-colors focus:border-[#8FA8FF]"
                      />
                      <div className="flex w-[44px] flex-col">
                        <button
                          type="button"
                          onClick={() => adjustVersion(1)}
                          className="h-1/2 rounded-tr-xl border border-l-0 border-[#31416F] bg-[#0B1020] text-base font-bold leading-none text-[#8FA8FF] transition-colors hover:bg-[#16203B]"
                          title="Increment Version"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustVersion(-1)}
                          className="h-1/2 rounded-br-xl border border-l-0 border-t-0 border-[#31416F] bg-[#0B1020] text-base font-bold leading-none text-[#8FA8FF] transition-colors hover:bg-[#16203B]"
                          title="Decrement Version"
                        >
                          -
                        </button>
                      </div>
                    </div>
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => void runManagerAction('upload')}
                    disabled={Boolean(activeAction) || !selectedPackage}
                    title={uploadBlocked ? 'Current Version Exists on NPM' : 'Upload selected package to npm'}
                    className={`rounded-xl px-4 py-3 font-semibold text-black transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      flashTarget === 'upload'
                        ? 'bg-red-500 hover:bg-red-400'
                        : uploadBlocked
                        ? 'bg-[#E5B94F] hover:bg-[#E5B94F]'
                        : 'bg-[#EBCA6A] hover:bg-[#F4D883]'
                    }`}
                  >
                    {activeAction === 'upload'
                      ? 'Working...'
                      : uploadBlocked
                      ? 'Upload Disabled'
                      : 'Upload To npm Manager'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void runManagerAction('download')}
                    disabled={Boolean(activeAction) || !selectedPackage}
                    title={
                      downloadBlocked
                        ? 'Active Version Already DownLoaded'
                        : 'Download selected package from npm'
                    }
                    className={`rounded-xl px-4 py-3 font-semibold text-black transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
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
                      ? 'DownLoad Disabled'
                      : 'Download From npm Manager'}
                  </button>
                </div>
                <div>
                  <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                    <button
                      type="button"
                      onClick={handleSourceToggle}
                      className="rounded-xl px-4 py-3 font-semibold text-black transition-colors bg-[#EBCA6A] hover:bg-[#F4D883]"
                    >
                      Select Node Source
                    </button>
                    <div
                      className="flex items-center rounded-xl border border-[#31416F] bg-[#0B1020] px-4 py-3 text-sm font-semibold text-slate-200"
                      aria-label="Selected package source"
                    >
                      {currentSourceLabel}
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-700 pt-5">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-[#8FA8FF]">NPM Query Results</h3>
                  </div>
                </div>
                <div>
                  <span className="mb-2 block text-sm font-semibold text-[#8FA8FF]">Workspace Paths</span>
                  <div className="rounded-xl border border-[#31416F] bg-[#0B1020] p-4 text-sm text-slate-200">
                    <p className="font-semibold text-white">Expected local directories</p>
                    <p className="mt-2 font-mono text-xs text-[#EBCA6A]">/spCoinAccess/spCoinNpmSource</p>
                    <p className="mt-1 font-mono text-xs text-[#EBCA6A]">/spCoinAccess/spCoinNpmSource/packages</p>
                    <p className="mt-1 font-mono text-xs text-[#EBCA6A]">/spCoinAccess/spCoinNpmSource/backups</p>
                  </div>
                </div>
                <div>
                  <span className="mb-2 block text-sm font-semibold text-[#8FA8FF]">Status</span>
                  <div className="rounded-xl border border-dashed border-[#31416F] bg-[#0B1020] p-4 text-sm text-slate-300">
                    <p className="leading-6">{status}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="scrollbar-hide flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden rounded-2xl bg-[#192134] p-4">
              <div className="mb-4 flex items-center justify-center border-b border-slate-700 pb-3">
                <h2 className="text-center text-xl font-semibold text-[#8FA8FF]">SpCoin Contract Deployment Controller</h2>
              </div>

              <div className={`${cardClass} scrollbar-hide flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-2`}>
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-[#8FA8FF]">Deployment Manager</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#8FA8FF]">Deployment Contract</span>
                    <select
                      value={deploymentName}
                      onChange={(event) => setDeploymentName(event.target.value)}
                      className="w-full rounded-xl border border-[#31416F] bg-[#0B1020] px-4 py-3 text-white outline-none transition-colors focus:border-[#8FA8FF]"
                    >
                      <option value="sPCoin">sPCoin</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#8FA8FF]">Contract Version</span>
                    <div className="flex h-[50px] items-stretch">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={deploymentVersion}
                        onChange={(event) => setDeploymentVersion(sanitizeVersionInput(event.target.value))}
                        placeholder="0.0.1"
                        className="w-full rounded-l-xl rounded-r-none border border-[#31416F] bg-[#0B1020] px-4 py-3 text-white outline-none transition-colors focus:border-[#8FA8FF]"
                      />
                      <div className="flex w-[44px] flex-col">
                        <button
                          type="button"
                          onClick={() => adjustDeploymentVersion(1)}
                          className="h-1/2 rounded-tr-xl border border-l-0 border-[#31416F] bg-[#0B1020] text-base font-bold leading-none text-[#8FA8FF] transition-colors hover:bg-[#16203B]"
                          title="Increment Contract Version"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustDeploymentVersion(-1)}
                          className="h-1/2 rounded-br-xl border border-l-0 border-t-0 border-[#31416F] bg-[#0B1020] text-base font-bold leading-none text-[#8FA8FF] transition-colors hover:bg-[#16203B]"
                          title="Decrement Contract Version"
                        >
                          -
                        </button>
                      </div>
                    </div>
                  </label>
                </div>

                <div className="flex gap-4">
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleDeploy}
                      className="rounded-xl px-4 py-3 font-semibold text-black transition-colors bg-[#EBCA6A] hover:bg-[#F4D883]"
                    >
                      Deploy
                    </button>
                  </div>

                  <label className="block flex-1">
                    <input
                      type="text"
                      value=""
                      readOnly
                      placeholder="Deployment Contract Private Key Required."
                      className="w-full rounded-xl border border-[#31416F] bg-[#0B1020] px-4 py-3 text-slate-300 outline-none"
                    />
                  </label>
                </div>

                <div className="flex flex-col gap-4">
                  <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                    <span className="text-sm font-semibold text-[#8FA8FF]">{`${deploymentName}.${deploymentVersion} Public Key`}</span>
                    <input
                      type="text"
                      value=""
                      readOnly
                      placeholder="Public Key, Returned from Deployment"
                      className="w-full rounded-xl border border-[#31416F] bg-[#0B1020] px-4 py-3 text-slate-300 outline-none"
                    />
                  </label>

                  <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                    <span className="text-sm font-semibold text-[#8FA8FF]">{`${deploymentName}.${deploymentVersion} Private Key`}</span>
                    <input
                      type="text"
                      value=""
                      readOnly
                      placeholder="Private Key, Returned from Deployment"
                      className="w-full rounded-xl border border-[#31416F] bg-[#0B1020] px-4 py-3 text-slate-300 outline-none"
                    />
                  </label>
                </div>

                <div className="border-t border-slate-700 pt-5">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-[#8FA8FF]">Contract Deplloyment Results</h3>
                  </div>
                </div>

                <div>
                  <span className="mb-2 block text-sm font-semibold text-[#8FA8FF]">Status</span>
                  <div className="rounded-xl border border-dashed border-[#31416F] bg-[#0B1020] p-4 text-sm text-slate-300">
                    <p className="leading-6">{deploymentStatus}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
