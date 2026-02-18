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
  const connected = Boolean(ctx?.exchangeContext?.network?.connected);

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
    const activeAddress = ctx?.exchangeContext?.accounts?.activeAccount?.address;
    setPublicKey(activeAddress ? String(activeAddress) : '');
  }, [ctx?.exchangeContext?.accounts?.activeAccount?.address]);

  useEffect(() => {
    const activeAddress = ctx?.exchangeContext?.accounts?.activeAccount?.address;
    if (!connected || !activeAddress) return;

    const abortController = new AbortController();

    const loadConnectedAccount = async () => {
      try {
        const response = await fetch(
          `/api/spCoin/accounts/${encodeURIComponent(String(activeAddress))}`,
          {
            method: 'GET',
            cache: 'no-store',
            signal: abortController.signal,
          },
        );
        if (!response.ok) return;

        const payload = await response.json();
        const data = (payload?.data ?? {}) as Record<string, unknown>;

        setFormData((prev) => ({
          ...prev,
          name: typeof data.name === 'string' ? data.name : prev.name,
          symbol: typeof data.symbol === 'string' ? data.symbol : prev.symbol,
          email: typeof data.email === 'string' ? data.email : prev.email,
          website: typeof data.website === 'string' ? data.website : prev.website,
          description:
            typeof data.description === 'string'
              ? data.description
              : prev.description,
          logoUrl:
            typeof data.logoUrl === 'string'
              ? data.logoUrl
              : typeof data.logoURL === 'string'
              ? data.logoURL
              : prev.logoUrl,
        }));
      } catch {
        // Ignore network/404/abort for account prefill.
      }
    };

    void loadConnectedAccount();
    return () => abortController.abort();
  }, [connected, ctx?.exchangeContext?.accounts?.activeAccount?.address]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!publicKey.trim()) next.publicKey = 'Account Public Key is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!connected) return;
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected) return;
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
  const disconnectedInputMessage =
    'Connection Required and input is prohibited until connection is established.';
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

      <form onSubmit={handleSubmit} className="space-y-4">
        {!connected ? (
          <div className="flex items-center gap-4">
            <div className="w-56" />
            <div className="flex-1">
              <div className="flex h-[42px] items-center justify-between rounded border border-white bg-transparent pl-3 [&>div]:h-full [&>div>div]:h-full [&>div>div>button]:!h-full [&>div>div>button]:!bg-[#E5B94F] [&>div>div>button]:!text-black [&>div>div>button]:!text-[120%] [&>div>div>button]:!px-3 [&>div>div>button]:!py-0 [&>div>div>button]:!rounded [&>div>div>button]:hover:!bg-green-500 [&>div>div>button>img]:!h-6 [&>div>div>button>img]:!w-6">
                <span className="text-[110%] font-normal text-white">Wallet Connection Required</span>
                <ConnectNetworkButtonProps
                  showName={false}
                  showSymbol={true}
                  showNetworkIcon={false}
                  showChevron={false}
                  showConnect={true}
                  showDisconnect={false}
                  showHoverBg={false}
                  titleDisplay={true}
                  trimHorizontalPaddingPx={0}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <label htmlFor="publicKey" className="w-56 text-right" title={fieldTitles.publicKey}>
              Account Public Key
            </label>
            <div className="flex-1">
              <input
                id="publicKey"
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
        )}

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
                readOnly={!connected}
                placeholder={
                  hoveredInput === name
                    ? !connected
                      ? disconnectedInputMessage
                      : fieldPlaceholders[name as keyof typeof fieldPlaceholders]
                    : 'Optional'
                }
                title={!connected ? disconnectedInputMessage : labelTitle}
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
            id="logoFileUpload"
            type="file"
            accept="image/*"
            className="hidden"
            aria-label="Account logo file upload"
            title="Select account logo file"
            onChange={handleLogoFileChange}
          />
          <button
            type="button"
            aria-disabled={!connected}
            className={`flex-1 rounded px-6 py-2 text-center font-bold text-black transition-colors ${
              !connected
                ? hoverTarget === 'uploadLogo'
                  ? 'bg-red-500 text-black'
                  : 'bg-[#E5B94F] text-black cursor-not-allowed'
                : hoverTarget === 'uploadLogo'
                ? formData.logoUrl
                  ? 'bg-green-500 text-black'
                  : 'bg-red-500 text-black'
                : 'bg-[#E5B94F] text-black'
            }`}
            title={!connected ? 'WWallet Connection Required' : fieldTitles.logoUrl}
            onClick={() => {
              if (!connected) return;
              logoFileInputRef.current?.click();
            }}
            onMouseEnter={() => setHoverTarget('uploadLogo')}
            onMouseLeave={() => setHoverTarget(null)}
          >
            Select Logo PNG File
          </button>
          <button
            type="submit"
            aria-disabled={!connected}
            className={`flex-1 rounded px-6 py-2 text-center font-bold text-black transition-colors ${
              !connected
                ? hoverTarget === 'createAccount'
                  ? 'bg-red-500 text-black'
                  : 'bg-[#E5B94F] text-black cursor-not-allowed'
                : hoverTarget === 'createAccount'
                ? requiredReady
                  ? 'bg-green-500 text-black'
                  : 'bg-red-500 text-black'
                : 'bg-[#E5B94F] text-black'
            }`}
            title={!connected ? 'Wallet Connection Required' : 'Create spCoin Account'}
            onMouseEnter={() => setHoverTarget('createAccount')}
            onMouseLeave={() => setHoverTarget(null)}
          >
            Create spCoin Account
          </button>
        </div>
        {formData.logoUrl ? (
          <p className="ml-[15rem] mt-1 text-sm text-white/80">{formData.logoUrl}</p>
        ) : null}
      </form>
    </main>
  );
}
