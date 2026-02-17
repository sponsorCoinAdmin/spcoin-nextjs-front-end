'use client';

import React, { useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';
import ConnectNetworkButtonProps from '@/components/views/Buttons/Connect/ConnectNetworkButton';

interface AccountFormData {
  name: string;
  symbol: string;
  email: string;
  website: string;
  description: string;
  logoUrl: string;
}

type HoverTarget = 'createAccount' | 'uploadLogo' | null;

export default function CreateAccountPage() {
  const router = useRouter();
  const ctx = useContext(ExchangeContextState);
  const connected = ctx?.exchangeContext?.accounts?.activeAccount;

  const [publicKey, setPublicKey] = useState<string>('');
  const [formData, setFormData] = useState<AccountFormData>({
    name: '',
    symbol: '',
    email: '',
    website: '',
    description: '',
    logoUrl: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hoverTarget, setHoverTarget] = useState<HoverTarget>(null);
  const [hoveredInput, setHoveredInput] = useState<string | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setPublicKey(connected?.address ? String(connected.address) : '');
  }, [connected?.address]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!publicKey.trim()) next.publicKey = 'Account Public Key is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    alert('Account created successfully');
    router.push('/');
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFormData((prev) => ({ ...prev, logoUrl: file ? file.name : '' }));
  };

  const baseInputClasses =
    'w-full rounded border border-white bg-[#1A1D2E] p-2 text-white focus:outline-none focus:ring-0';
  const requiredInputClasses = `${baseInputClasses} placeholder:text-red-500`;
  const optionalInputClasses = `${baseInputClasses} placeholder:text-green-400`;
  const requiredReady = publicKey.trim().length > 0;
  const fieldTitles = {
    publicKey: 'Required Account on a connected Metamask Account.',
    name: 'Account Name, Do Not use a personal name',
    symbol: 'Account Symbol',
    email: 'Account Email',
    website: 'Accounts Website',
    description: 'Account Description',
    logoUrl: 'Logo URL',
  } as const;
  const fieldPlaceholders = {
    publicKey: 'Required Account on a connected Metamask Account.',
    name: 'Account Name Title, Example: "Save the World"',
    symbol: 'Account Symbol, For Example "WORLD"',
    email: 'Account Email, do not use a personal Email',
    website: 'Accounts Website URL',
    description: 'Account Description',
    logoUrl: 'Logo URL, Select Avatar Logo png file for upload',
  } as const;

  return (
    <main className="mx-auto max-w-3xl p-6 text-white">
      <h1 className="mb-6 text-center text-2xl font-bold text-[#E5B94F]">Create Sponsor Coin Account</h1>

      <div className="mb-4 flex items-center gap-4">
        <label className="w-56 text-right" title={fieldTitles.publicKey}>
          Account Public Key
        </label>
        <div className="flex-1">
          <input
            type="text"
            value={publicKey}
            readOnly
            placeholder={hoveredInput === 'publicKey' ? fieldPlaceholders.publicKey : 'Required'}
            title="Required for Code Account Operations"
            className={requiredInputClasses}
            onMouseEnter={() => setHoveredInput('publicKey')}
            onMouseLeave={() => setHoveredInput(null)}
          />
          {errors.publicKey ? <p className="mt-1 text-sm text-red-500">{errors.publicKey}</p> : null}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          {
            label: 'Name',
            name: 'name',
            labelTitle: fieldTitles.name,
          },
          {
            label: 'Symbol',
            name: 'symbol',
            labelTitle: fieldTitles.symbol,
          },
          {
            label: 'Email Address',
            name: 'email',
            labelTitle: fieldTitles.email,
          },
          {
            label: 'Website',
            name: 'website',
            labelTitle: fieldTitles.website,
          },
          {
            label: 'Description',
            name: 'description',
            labelTitle: fieldTitles.description,
          },
          {
            label: 'Logo URL',
            name: 'logoUrl',
            labelTitle: fieldTitles.logoUrl,
          },
        ].map(({ label, name, labelTitle }) => (
          <div key={name} className="flex items-center gap-4">
            <label htmlFor={name} className="w-56 text-right" title={labelTitle}>
              {label}
            </label>
            <div className="flex-1">
              <input
                id={name}
                name={name}
                type="text"
                value={formData[name as keyof AccountFormData]}
                onChange={handleChange}
                placeholder={hoveredInput === name ? fieldPlaceholders[name as keyof typeof fieldPlaceholders] : 'Optional'}
                title={labelTitle}
                className={optionalInputClasses}
                onMouseEnter={() => setHoveredInput(name)}
                onMouseLeave={() => setHoveredInput(null)}
              />
            </div>
          </div>
        ))}

        <div className="mt-6 ml-[15rem] flex w-[calc(100%-15rem)] items-center justify-start gap-3">
          <input
            ref={logoFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoFileChange}
          />
          <button
            type="button"
            className={`flex-1 rounded px-6 py-2 text-center font-bold text-black transition-colors ${
              hoverTarget === 'uploadLogo'
                ? formData.logoUrl
                  ? 'bg-green-500 text-black'
                  : 'bg-red-500 text-black'
                : 'bg-[#E5B94F] text-black'
            }`}
            title={fieldTitles.logoUrl}
            onClick={() => logoFileInputRef.current?.click()}
            onMouseEnter={() => setHoverTarget('uploadLogo')}
            onMouseLeave={() => setHoverTarget(null)}
          >
            Select Logo PNG File
          </button>
          <button
            type="submit"
            className={`flex-1 rounded px-6 py-2 text-center font-bold text-black transition-colors ${
              hoverTarget === 'createAccount'
                ? requiredReady
                  ? 'bg-green-500 text-black'
                  : 'bg-red-500 text-black'
                : 'bg-[#E5B94F] text-black'
            }`}
            onMouseEnter={() => setHoverTarget('createAccount')}
            onMouseLeave={() => setHoverTarget(null)}
          >
            Create spCoin Account
          </button>
        </div>
        {formData.logoUrl ? (
          <p className="ml-[15rem] mt-1 text-sm text-white/80">{formData.logoUrl}</p>
        ) : null}
        <div className="flex items-center gap-4">
          <div className="w-56" />
          <div className="flex flex-1 items-center">
            <ConnectNetworkButtonProps
              showName={false}
              showSymbol={true}
              showChevron={true}
              showConnect={true}
              showDisconnect={false}
              showHoverBg={true}
            />
          </div>
        </div>
      </form>
    </main>
  );
}
