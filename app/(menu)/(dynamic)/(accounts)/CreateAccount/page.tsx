'use client';

import React, { useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';
import { ChevronDown } from 'lucide-react';

interface AccountFormData {
  email: string;
  website: string;
  logoAvatar: string;
  infuraKey: string;
  connectKitKey: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
}

type AccountType = 'Sponsor' | 'Recipient' | 'Agent' | 'Not Specified';
type HoverTarget = 'createAccount' | 'createAgentSite' | null;

export default function CreateAccountPage() {
  const router = useRouter();
  const ctx = useContext(ExchangeContextState);
  const connected = ctx?.exchangeContext?.accounts?.activeAccount;

  const [accountType, setAccountType] = useState<AccountType>('Not Specified');
  const [isAccountTypeOpen, setIsAccountTypeOpen] = useState(false);
  const effectiveType = accountType === 'Not Specified' ? 'Generic' : accountType;
  const article = /^[aeiou]/i.test(effectiveType) ? 'an' : 'a';

  const [publicKey, setPublicKey] = useState<string>('');
  const [formData, setFormData] = useState<AccountFormData>({
    email: '',
    website: '',
    logoAvatar: '',
    infuraKey: '',
    connectKitKey: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const accountTypeMenuRef = useRef<HTMLDivElement | null>(null);
  const [hoverTarget, setHoverTarget] = useState<HoverTarget>(null);
  const [hoveredInput, setHoveredInput] = useState<string | null>(null);

  useEffect(() => {
    setPublicKey(connected?.address ? String(connected.address) : '');
  }, [connected?.address]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!accountTypeMenuRef.current) return;
      if (!accountTypeMenuRef.current.contains(event.target as Node)) {
        setIsAccountTypeOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!publicKey.trim()) next.publicKey = 'Account Public Key is required';
    if (accountType === 'Agent') {
      if (!formData.infuraKey.trim()) next.infuraKey = 'Infura Key is required';
      if (!formData.connectKitKey.trim()) next.connectKitKey = 'Connect Kit Key is required';
    }
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
    alert(`${effectiveType} account created successfully`);
    router.push('/');
  };

  const baseInputClasses =
    'w-full rounded border border-white bg-[#1A1D2E] p-2 text-white focus:outline-none focus:ring-0';
  const requiredInputClasses = `${baseInputClasses} placeholder:text-red-500`;
  const optionalInputClasses = `${baseInputClasses} placeholder:text-green-400`;
  const requiredReady =
    publicKey.trim().length > 0 &&
    (accountType !== 'Agent' ||
      (formData.infuraKey.trim().length > 0 && formData.connectKitKey.trim().length > 0));
  const fieldTitles = {
    publicKey: 'Required Account on a connected Metamask Account.',
    infuraKey: 'Required for Code Account Operations',
    connectKitKey: 'Required for Code Account Operations',
    firstName: 'Required to describe the account, For Example "Save the World". Not a Personal Name.',
    lastName: 'Shortened Name, Symbol For Example "WORLD"',
    email: 'Account Email, do not use a personal Email',
    website: 'Accounts Website',
    phone: 'Account Phone Number, do not use a personal Phone Number',
    address: 'Account Address do not use a personal Address',
    logoAvatar: 'Logo URL Location to be uploaded for Account Display',
  } as const;

  return (
    <main className="mx-auto max-w-3xl p-6 text-white">
      <h1 className="mb-6 text-center text-2xl font-bold text-[#E5B94F]">{`Create ${article} ${effectiveType} Account`}</h1>

      <div className="mb-4 flex items-center gap-4">
        <label className="w-56 text-right" title={fieldTitles.publicKey}>
          Account Public Key
        </label>
        <div className="flex-1">
          <input
            type="text"
            value={publicKey}
            readOnly
            placeholder={hoveredInput === 'publicKey' ? fieldTitles.publicKey : 'Required'}
            title="Required for Code Account Operations"
            className={requiredInputClasses}
            onMouseEnter={() => setHoveredInput('publicKey')}
            onMouseLeave={() => setHoveredInput(null)}
          />
          {errors.publicKey ? <p className="mt-1 text-sm text-red-500">{errors.publicKey}</p> : null}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-4">
          <label
            htmlFor="accountType"
            className="w-56 self-start pt-2 text-right"
            title="Select account type for this account."
          >
            Account Type
          </label>
          <div ref={accountTypeMenuRef} className="flex-1">
            <div
              id="accountType"
              className={`${baseInputClasses} relative flex items-center pr-12`}
              title="Select account type"
            >
              <span>{accountType}</span>
              <button
                type="button"
                aria-expanded={isAccountTypeOpen}
                aria-controls="accountTypeMenuOptions"
                aria-label="Open account type options"
                title="Open account type options"
                className="absolute right-0 top-1/2 flex h-full w-10 -translate-y-1/2 items-center justify-center bg-white text-black"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsAccountTypeOpen((v) => !v);
                }}
              >
                <ChevronDown
                  size={18}
                  className={`transition-transform duration-200 ${isAccountTypeOpen ? 'rotate-180' : 'rotate-0'}`}
                />
              </button>
            </div>
            <div
              id="accountTypeMenuOptions"
              className={`overflow-hidden transition-all duration-200 ease-out ${
                isAccountTypeOpen ? 'mt-2 max-h-60' : 'max-h-0'
              }`}
            >
              <div className="rounded border border-white bg-[#1A1D2E]">
                {(['Sponsor', 'Recipient', 'Agent', 'Not Specified'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`block w-full px-3 py-2 text-left text-white hover:bg-[#243056] ${
                      accountType === option ? 'bg-[#243056]' : ''
                    }`}
                    onClick={() => {
                      setAccountType(option);
                      setIsAccountTypeOpen(false);
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {accountType === 'Agent' ? (
          <>
            <div className="flex items-center gap-4">
              <label
                htmlFor="infuraKey"
                className="w-56 text-right"
                title={fieldTitles.infuraKey}
              >
                Infura Key
              </label>
              <div className="flex-1">
                <input
                  id="infuraKey"
                  name="infuraKey"
                  type="text"
                  value={formData.infuraKey}
                  onChange={handleChange}
                  placeholder={hoveredInput === 'infuraKey' ? fieldTitles.infuraKey : 'Required'}
                  title="Required for Code Account Operations"
                  className={requiredInputClasses}
                  onMouseEnter={() => setHoveredInput('infuraKey')}
                  onMouseLeave={() => setHoveredInput(null)}
                />
                {errors.infuraKey ? <p className="mt-1 text-sm text-red-500">{errors.infuraKey}</p> : null}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label
                htmlFor="connectKitKey"
                className="w-56 text-right"
                title={fieldTitles.connectKitKey}
              >
                Connect Kit Key
              </label>
              <div className="flex-1">
                <input
                  id="connectKitKey"
                  name="connectKitKey"
                  type="text"
                  value={formData.connectKitKey}
                  onChange={handleChange}
                  placeholder={hoveredInput === 'connectKitKey' ? fieldTitles.connectKitKey : 'Required'}
                  title="Required for Code Account Operations"
                  className={requiredInputClasses}
                  onMouseEnter={() => setHoveredInput('connectKitKey')}
                  onMouseLeave={() => setHoveredInput(null)}
                />
                {errors.connectKitKey ? (
                  <p className="mt-1 text-sm text-red-500">{errors.connectKitKey}</p>
                ) : null}
              </div>
            </div>
          </>
        ) : null}

        {[
          { label: 'Name', name: 'firstName', title: fieldTitles.firstName },
          { label: 'Symbol', name: 'lastName', title: fieldTitles.lastName },
          { label: 'Email Address', name: 'email', title: fieldTitles.email },
          { label: 'Website', name: 'website', title: fieldTitles.website },
          { label: 'Phone Number', name: 'phone', title: fieldTitles.phone },
          { label: 'Address', name: 'address', title: fieldTitles.address },
          { label: 'Logo URL', name: 'logoAvatar', title: fieldTitles.logoAvatar },
        ].map(({ label, name, title }) => (
          <div key={name} className="flex items-center gap-4">
            <label htmlFor={name} className="w-56 text-right" title={title}>
              {label}
            </label>
            <div className="flex-1">
              <input
                id={name}
                name={name}
                type="text"
                value={formData[name as keyof AccountFormData]}
                onChange={handleChange}
                placeholder={hoveredInput === name ? title : 'Optional'}
                title="Optional for Privacy"
                className={optionalInputClasses}
                onMouseEnter={() => setHoveredInput(name)}
                onMouseLeave={() => setHoveredInput(null)}
              />
            </div>
          </div>
        ))}

        <div className="mt-6 ml-[15rem] flex w-[calc(100%-15rem)] items-center justify-start gap-3">
          <button
            type="submit"
            className={`rounded px-6 py-2 text-center font-bold text-black transition-colors ${
              accountType === 'Agent' ? 'flex-1' : 'w-full'
            } ${
              hoverTarget === 'createAccount'
                ? requiredReady
                  ? 'bg-green-500 text-black'
                  : 'bg-red-500 text-black'
                : 'bg-[#E5B94F] text-black'
            }`}
            onMouseEnter={() => setHoverTarget('createAccount')}
            onMouseLeave={() => setHoverTarget(null)}
          >
            {`Create ${effectiveType} Account`}
          </button>
          {accountType === 'Agent' ? (
            <button
              type="button"
              className={`flex-1 rounded px-6 py-2 text-center font-bold text-black transition-colors ${
                hoverTarget === 'createAgentSite'
                  ? requiredReady
                    ? 'bg-green-500 text-black'
                    : 'bg-red-500 text-black'
                  : 'bg-[#E5B94F] text-black'
              }`}
              onMouseEnter={() => setHoverTarget('createAgentSite')}
              onMouseLeave={() => setHoverTarget(null)}
            >
              Create Agent Site
            </button>
          ) : null}
        </div>
      </form>
    </main>
  );
}
