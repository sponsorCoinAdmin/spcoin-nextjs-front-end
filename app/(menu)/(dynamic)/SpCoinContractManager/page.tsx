'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import CloseButton from '@/components/views/Buttons/CloseButton';

export default function SpCoinContractManagerPage() {
  const router = useRouter();
  const [status, setStatus] = useState(
    'Enter your private spCoin deployment values, then use Deploy once the server-side contract automation is connected.',
  );
  const [deploymentName, setDeploymentName] = useState('spCoin');
  const [deploymentVersion, setDeploymentVersion] = useState('latest');
  const [privateKeyValue, setPrivateKeyValue] = useState('');
  const [publicKeyValue, setPublicKeyValue] = useState('');

  const cardClass =
    'rounded-2xl border border-[#2B3A67] bg-[#11162A] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.25)]';

  const handleDeploy = () => {
    const normalizedName = deploymentName.trim() || 'spCoin';
    const normalizedVersion = deploymentVersion.trim() || 'latest';
    const missingFields: string[] = [];

    if (!privateKeyValue.trim()) missingFields.push('private key');
    if (!publicKeyValue.trim()) missingFields.push('public key');

    if (missingFields.length > 0) {
      setStatus(`Deployment blocked: missing ${missingFields.join(' and ')}.`);
      return;
    }

    setStatus(
      `Deployment scaffold prepared for ${normalizedName} (${normalizedVersion}). Server-side deployment automation is not connected yet.`,
    );
  };

  return (
    <main className="relative w-full bg-[#0B1020] p-6 text-white">
      <div className="mb-6 grid grid-cols-[1fr_auto_1fr] items-center">
        <div />
        <h1 className="text-center text-2xl font-bold text-[#5981F3]">SpCoin Contract Manager</h1>
        <div className="flex items-center justify-self-end gap-2">
          <CloseButton
            id="spCoinContractManagerBackButton"
            closeCallback={() => router.back()}
            title="Go Back"
            ariaLabel="Go Back"
            className="h-10 w-10 rounded-full bg-[#243056] text-3xl leading-none text-[#5981F3] flex items-center justify-center transition-colors hover:bg-[#5981F3] hover:text-[#243056]"
          />
        </div>
      </div>

      <div className="flex w-full flex-col gap-6">
        <section>
          <div className="flex h-full min-h-[calc(70vh-1rem)] flex-col gap-6 md:flex-row">
            <div className="scrollbar-hide min-w-0 flex-1 overflow-y-auto overflow-x-hidden rounded-2xl bg-[#192134] p-4 md:px-[100px]">
              <div className="mb-4 flex items-center justify-between border-b border-slate-700 pb-3">
                <h2 className="text-xl font-semibold text-[#8FA8FF]">Left Panel: Deployment</h2>
                <span className="rounded-full bg-[#0B1020] px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-[#EBCA6A]">
                  spCoin
                </span>
              </div>

              <div className={`${cardClass} scrollbar-hide flex max-h-[calc(70vh-8rem)] flex-col gap-5 overflow-y-auto pr-2`}>
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-[#8FA8FF]">spCoin Deployment</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#8FA8FF]">Deployment Name</span>
                    <input
                      type="text"
                      value={deploymentName}
                      onChange={(event) => setDeploymentName(event.target.value)}
                      placeholder="spCoin"
                      className="w-full rounded-xl border border-[#31416F] bg-[#0B1020] px-4 py-3 text-white outline-none transition-colors focus:border-[#8FA8FF]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#8FA8FF]">Version</span>
                    <input
                      type="text"
                      value={deploymentVersion}
                      onChange={(event) => setDeploymentVersion(event.target.value)}
                      placeholder="latest"
                      className="w-full rounded-xl border border-[#31416F] bg-[#0B1020] px-4 py-3 text-white outline-none transition-colors focus:border-[#8FA8FF]"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#8FA8FF]">Private Key Value</span>
                    <input
                      type="password"
                      value={privateKeyValue}
                      onChange={(event) => setPrivateKeyValue(event.target.value)}
                      placeholder="Enter private key"
                      className="w-full rounded-xl border border-[#31416F] bg-[#0B1020] px-4 py-3 text-white outline-none transition-colors focus:border-[#8FA8FF]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#8FA8FF]">Public Key Value</span>
                    <input
                      type="text"
                      value={publicKeyValue}
                      onChange={(event) => setPublicKeyValue(event.target.value)}
                      placeholder="Enter public key"
                      className="w-full rounded-xl border border-[#31416F] bg-[#0B1020] px-4 py-3 text-white outline-none transition-colors focus:border-[#8FA8FF]"
                    />
                  </label>
                </div>

                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={handleDeploy}
                    className="rounded-xl bg-green-500 px-6 py-3 font-semibold text-black transition-colors hover:bg-green-400"
                  >
                    Deploy
                  </button>
                </div>
                <div className="border-t border-slate-700 pt-5">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-[#8FA8FF]">Contract Query Results</h3>
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

            <div className="scrollbar-hide min-w-0 overflow-y-auto overflow-x-hidden rounded-2xl bg-[#192134] p-4 md:flex-1">
              <div className="mb-4 flex items-center justify-between border-b border-slate-700 pb-3">
                <h2 className="text-xl font-semibold text-[#8FA8FF]">Right Panel: Status</h2>
                <span className="rounded-full bg-[#0B1020] px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-[#EBCA6A]">
                  Contract
                </span>
              </div>

            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
