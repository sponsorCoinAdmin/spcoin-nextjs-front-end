'use client';

import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';
import ConnectNetworkButtonProps from '@/components/views/Buttons/Connect/ConnectNetworkButton';
import { getWalletLogoURL } from '@/lib/context/helpers/assetHelpers';

interface AccountFormData {
  name: string;
  symbol: string;
  email: string;
  website: string;
  description: string;
}

type HoverTarget = 'createAccount' | 'uploadLogo' | 'revertChanges' | null;
type AccountMode = 'create' | 'edit' | 'update';
const DEFAULT_ACCOUNT_LOGO_URL = '/assets/miscellaneous/Anonymous.png';
function normalizeAddress(value: string): string {
  return `0x${String(value).replace(/^0[xX]/, '').toLowerCase()}`;
}

function ensureAbsoluteAssetURL(value: string): string {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return DEFAULT_ACCOUNT_LOGO_URL;
  if (trimmed.startsWith('/')) return trimmed;
  if (trimmed.startsWith('assets/')) return `/${trimmed}`;
  return trimmed;
}

function toPreviewHref(
  field: keyof AccountFormData,
  rawValue: string,
): string | null {
  const value = String(rawValue ?? '').trim();
  if (!value) return null;

  if (field === 'email') {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    return emailOk ? `mailto:${value}` : null;
  }

  if (field === 'website') {
    if (value.startsWith('/assets/')) return value;
    if (value.startsWith('assets/')) return `/${value}`;
    try {
      const url = new URL(value);
      return /^https?:$/i.test(url.protocol) ? value : null;
    } catch {
      return null;
    }
  }

  return null;
}

export default function CreateAccountPage() {
  const ctx = useContext(ExchangeContextState);
  const connected = Boolean(ctx?.exchangeContext?.network?.connected);

  const [publicKey, setPublicKey] = useState<string>('');
  const [formData, setFormData] = useState<AccountFormData>({
    name: '',
    symbol: '',
    email: '',
    website: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hoverTarget, setHoverTarget] = useState<HoverTarget>(null);
  const [hoveredInput, setHoveredInput] = useState<string | null>(null);
  const [baselineData, setBaselineData] = useState<AccountFormData>({
    name: '',
    symbol: '',
    email: '',
    website: '',
    description: '',
  });
  const [accountExists, setAccountExists] = useState<boolean>(false);
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAllBorders, setShowAllBorders] = useState(true);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [hasServerLogo, setHasServerLogo] = useState(false);
  const [serverLogoURL, setServerLogoURL] = useState(DEFAULT_ACCOUNT_LOGO_URL);
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
      setIsLoadingAccount(true);
      try {
        const response = await fetch(
          `/api/spCoin/accounts/${encodeURIComponent(String(activeAddress))}`,
          {
            method: 'GET',
            cache: 'no-store',
            signal: abortController.signal,
          },
        );
        if (!response.ok) {
          setAccountExists(false);
          const empty: AccountFormData = {
            name: '',
            symbol: '',
            email: '',
            website: '',
            description: '',
          };
          setFormData(empty);
          setBaselineData(empty);
          setLogoFile(null);
          setHasServerLogo(false);
          setServerLogoURL(DEFAULT_ACCOUNT_LOGO_URL);
          return;
        }

        const payload = await response.json();
        const data = (payload?.data ?? {}) as Record<string, unknown>;
        const resolvedLogoURL = ensureAbsoluteAssetURL(
          String(payload?.logoURL ?? data?.logoURL ?? DEFAULT_ACCOUNT_LOGO_URL),
        );

        const loaded: AccountFormData = {
          name: typeof data.name === 'string' ? data.name : '',
          symbol: typeof data.symbol === 'string' ? data.symbol : '',
          email: typeof data.email === 'string' ? data.email : '',
          website: typeof data.website === 'string' ? data.website : '',
          description: typeof data.description === 'string' ? data.description : '',
        };

        setAccountExists(true);
        setFormData(loaded);
        setBaselineData(loaded);
        setLogoFile(null);
        setHasServerLogo(Boolean(payload?.hasLogo));
        setServerLogoURL(resolvedLogoURL);
      } catch {
        if (!abortController.signal.aborted) {
          setAccountExists(false);
          setHasServerLogo(false);
          setServerLogoURL(DEFAULT_ACCOUNT_LOGO_URL);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingAccount(false);
        }
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

  const trimForm = (data: AccountFormData): AccountFormData => ({
    name: data.name.trim(),
    symbol: data.symbol.trim(),
    email: data.email.trim(),
    website: data.website.trim(),
    description: data.description.trim(),
  });

  const publicKeyTrimmed = publicKey.trim();
  const hasDataChanges = useMemo(() => {
    const current = trimForm(formData);
    const baseline = trimForm(baselineData);
    return (
      current.name !== baseline.name ||
      current.symbol !== baseline.symbol ||
      current.email !== baseline.email ||
      current.website !== baseline.website ||
      current.description !== baseline.description
    );
  }, [formData, baselineData]);

  const hasUnsavedChanges = hasDataChanges || !!logoFile;

  const accountMode: AccountMode = useMemo(() => {
    if (!connected || !publicKeyTrimmed) return 'create';
    if (!accountExists) return 'create';
    return hasUnsavedChanges ? 'update' : 'edit';
  }, [connected, publicKeyTrimmed, accountExists, hasUnsavedChanges]);

  const submitLabel =
    accountExists && !hasUnsavedChanges ? 'Edit Account' : 'Update Account';
  const previewObjectUrl = useMemo(() => {
    if (!logoFile) return '';
    return URL.createObjectURL(logoFile);
  }, [logoFile]);
  useEffect(() => {
    return () => {
      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    };
  }, [previewObjectUrl]);
  const logoPreviewSrc = !connected
    ? DEFAULT_ACCOUNT_LOGO_URL
    : previewObjectUrl || serverLogoURL;
  const previewButtonLabel = 'Select Preview Image';
  const canCreateMissingAccount =
    connected && !!publicKeyTrimmed && !accountExists;
  const disableSubmit =
    !connected ||
    isSaving ||
    isLoadingAccount ||
    !publicKeyTrimmed;
  const disableRevert = !connected || isSaving || isLoadingAccount;

  const handleRevertChanges = () => {
    if (disableRevert || !hasUnsavedChanges) return;
    setFormData(baselineData);
    setLogoFile(null);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected) return;
    if (!validate()) return;
    if (!publicKeyTrimmed) return;
    if (!hasUnsavedChanges && accountExists) {
      alert('No account or image changes to update');
      return;
    }

    setIsSaving(true);
    try {
      const eth = (window as any)?.ethereum;
      if (!eth?.request) {
        throw new Error('MetaMask provider not available');
      }

      const accounts = (await eth.request({
        method: 'eth_requestAccounts',
      })) as string[];
      const signerAddress = String(accounts?.[0] ?? '').trim();
      if (!signerAddress) {
        throw new Error('No MetaMask account available for signing');
      }
      if (
        normalizeAddress(signerAddress) !== normalizeAddress(publicKeyTrimmed)
      ) {
        throw new Error(
          `Connected wallet mismatch. MetaMask=${signerAddress}, Active=${publicKeyTrimmed}`,
        );
      }

      const nonceRes = await fetch('/api/spCoin/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: signerAddress }),
      });
      if (!nonceRes.ok) {
        throw new Error('Failed to request auth nonce');
      }
      const noncePayload = (await nonceRes.json()) as {
        nonce?: string;
        message?: string;
      };
      const nonce = String(noncePayload?.nonce ?? '');
      const message = String(noncePayload?.message ?? '');
      if (!nonce || !message) {
        throw new Error('Invalid nonce payload from server');
      }

      let signature = '';
      try {
        signature = (await eth.request({
          method: 'personal_sign',
          params: [message, signerAddress],
        })) as string;
      } catch {
        // Provider compatibility fallback (some providers expect [address, message]).
        signature = (await eth.request({
          method: 'personal_sign',
          params: [signerAddress, message],
        })) as string;
      }
      if (!signature) {
        throw new Error('Signature request rejected');
      }

      const verifyRes = await fetch('/api/spCoin/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: signerAddress,
          nonce,
          signature,
        }),
      });
      if (!verifyRes.ok) {
        const failPayload = (await verifyRes.json().catch(() => ({}))) as {
          error?: string;
          details?: string;
        };
        throw new Error(
          failPayload?.error ||
            failPayload?.details ||
            'Signature verification failed',
        );
      }
      const verifyPayload = (await verifyRes.json()) as { token?: string };
      const authToken = String(verifyPayload?.token ?? '');
      if (!authToken) {
        throw new Error('Missing auth token');
      }

      const normalizedForm = trimForm(formData);
      const shouldSaveAccount = hasDataChanges || !accountExists;
      const shouldSaveLogo = Boolean(logoFile);

      if (shouldSaveAccount) {
        const accountPayload = {
          address: publicKeyTrimmed,
          name: normalizedForm.name,
          symbol: normalizedForm.symbol,
          email: normalizedForm.email,
          website: normalizedForm.website,
          description: normalizedForm.description,
        };
        const saveMethod = accountExists ? 'PUT' : 'POST';
        const accountRes = await fetch(
          `/api/spCoin/accounts/${encodeURIComponent(publicKeyTrimmed)}`,
          {
            method: saveMethod,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify(accountPayload),
          },
        );
        if (!accountRes.ok) {
          throw new Error('Failed to save account.json');
        }
      }

      if (shouldSaveLogo && logoFile) {
        const logoForm = new FormData();
        logoForm.append('file', logoFile);
        const logoRes = await fetch(
          `/api/spCoin/accounts/${encodeURIComponent(publicKeyTrimmed)}?target=logo`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
            body: logoForm,
          },
        );
        if (!logoRes.ok) {
          throw new Error('Failed to save logo.png');
        }
      }

      if (shouldSaveAccount) {
        const savedForm: AccountFormData = { ...normalizedForm };
        setAccountExists(true);
        setFormData(savedForm);
        setBaselineData(savedForm);
      }

      if (shouldSaveLogo) {
        const canonicalLogoURL = getWalletLogoURL(publicKeyTrimmed);
        setLogoFile(null);
        setHasServerLogo(true);
        setServerLogoURL(canonicalLogoURL);
      }

      if (shouldSaveAccount && shouldSaveLogo) {
        alert('Account metadata and image updated successfully');
      } else if (shouldSaveAccount) {
        alert('Account metadata updated successfully');
      } else if (shouldSaveLogo) {
        alert('Account image updated successfully');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save account');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setLogoFile(file ?? null);
  };
  const baseInputClasses =
    'w-full rounded border border-white bg-[#1A1D2E] p-2 text-white focus:outline-none focus:ring-0';
  const requiredInputClasses = `${baseInputClasses} placeholder:text-red-500`;
  const optionalInputClasses = `${baseInputClasses} placeholder:text-green-400`;
  const labelCellClasses =
    'mb-0 text-right h-[42px] px-2 text-white flex items-center justify-end';
  const disconnectedInputMessage =
    'Connection Required and input is prohibited until connection is established.';
  const fieldTitles = {
    publicKey: 'Required Account on a connected Metamask Account.',
    name: 'Account Name, Do Not use a personal name',
    symbol: 'Account Symbol',
    email: 'Account Email',
    website: 'Accounts Website',
    description: 'Account Description',
  } as const;
  const fieldPlaceholders = {
    publicKey: 'Required Account on a connected Metamask Account.',
    name: 'Account Name Title, Example: "Save the World"',
    symbol: 'Account Symbol, For Example "WORLD"',
    email: 'Account Email, do not use a personal Email',
    website: 'Accounts Website URL',
    description: 'Account Description',
  } as const;
  const panelMarginClass = 'mx-0';
  const accountPanelBorderClass = showAllBorders ? 'border-2 border-yellow-400' : 'border-2 border-transparent';
  const avatarPanelBorderClass = showAllBorders ? 'border-2 border-red-500' : 'border-2 border-transparent';

  return (
    <main className="w-full p-6 text-white">
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          className={`rounded border px-3 py-1 text-sm font-semibold text-black ${
            showAllBorders
              ? 'border-green-500 bg-green-500 hover:bg-green-400'
              : 'border-red-500 bg-red-500 hover:bg-red-400'
          }`}
          onClick={() => setShowAllBorders((prev) => !prev)}
        >
          Toggle Borders
        </button>
      </div>
      <h1 className="mb-6 text-center text-2xl font-bold text-[#E5B94F]">Create Sponsor Coin Account</h1>

      <form onSubmit={handleSubmit} className="min-h-[72vh] w-full">
        <div className="grid w-full items-start justify-center gap-0 grid-cols-1 lg:grid-cols-[700px_700px]">
        {/* Visual right panel: Users Account Meta Data */}
        <section className={`${panelMarginClass} ${accountPanelBorderClass} order-2 flex h-full w-full flex-col items-start justify-start pl-0 pt-4 pb-4 pr-0`}>
          <div className="mb-4 grid w-full max-w-[46rem] grid-cols-[max-content_28rem]">
            <div className="invisible h-0 overflow-hidden px-2 whitespace-nowrap">
              Account Public Key
            </div>
            <h2 className="w-full text-center text-lg font-semibold text-[#E5B94F]">
              Users Account Meta Data
            </h2>
          </div>
          <div className="grid w-full max-w-[46rem] grid-cols-[max-content_28rem] items-center gap-x-4 gap-y-4">
          {!connected ? (
            <>
              <label htmlFor="publicKey" className={labelCellClasses} title={fieldTitles.publicKey}>
                Account Public Key
              </label>
              <div>
                <div className="flex h-[42px] items-center justify-center rounded border border-white bg-transparent">
                  <span className="text-[110%] font-normal text-red-500">Wallet Connection Required</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <label htmlFor="publicKey" className={labelCellClasses} title={fieldTitles.publicKey}>
                Account Public Key
              </label>
              <div>
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
            </>
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
          ].map(({ label, name, labelTitle }) => (
            <React.Fragment key={name}>
              <label htmlFor={name} className={labelCellClasses} title={labelTitle}>
                {label}
              </label>
              <div>
                {(() => {
                  const key = name as keyof AccountFormData;
                  const href = toPreviewHref(key, String(formData[key] ?? ''));
                  const isLinkField =
                    key === 'email' || key === 'website';
                  const linkLikeClass =
                    isLinkField && href
                      ? ' underline text-blue-300 cursor-pointer'
                      : '';
                  return (
                    <input
                      id={name}
                      name={name}
                      type="text"
                      value={
                        connected
                          ? formData[name as keyof AccountFormData]
                          : ''
                      }
                      onChange={handleChange}
                      readOnly={!connected}
                      placeholder={
                        hoveredInput === name
                          ? !connected
                            ? disconnectedInputMessage
                            : fieldPlaceholders[name as keyof typeof fieldPlaceholders]
                          : 'Optional'
                      }
                      title={
                        !connected
                          ? disconnectedInputMessage
                          : href
                            ? `${labelTitle} (click to open in Edit mode)`
                            : labelTitle
                      }
                      className={`${optionalInputClasses}${linkLikeClass}`}
                      onClick={() => {
                        if (!href || accountMode !== 'edit') return;
                        if (href.startsWith('mailto:')) {
                          window.location.href = href;
                          return;
                        }
                        window.open(href, '_blank', 'noopener,noreferrer');
                      }}
                      onMouseEnter={() => setHoveredInput(name)}
                      onMouseLeave={() => setHoveredInput(null)}
                    />
                  );
                })()}
              </div>
            </React.Fragment>
          ))}

            <div className="text-right" />
            {!connected ? (
              <div className="flex h-[42px] w-full items-center rounded border border-white bg-transparent [&>div]:h-full [&>div]:w-full [&>div>div]:h-full [&>div>div]:w-full [&>div>div>button]:!h-full [&>div>div>button]:!w-full [&>div>div>button]:!justify-center [&>div>div>button]:!font-bold [&>div>div>button]:!bg-green-500 [&>div>div>button]:!text-black [&>div>div>button]:!text-[120%] [&>div>div>button]:!px-3 [&>div>div>button]:!py-0 [&>div>div>button]:!rounded [&>div>div>button]:hover:!bg-green-400 [&>div>div>button>img]:!h-6 [&>div>div>button>img]:!w-6">
                <ConnectNetworkButtonProps
                  showName={false}
                  showSymbol={false}
                  showNetworkIcon={false}
                  showChevron={false}
                  showConnect={true}
                  showDisconnect={false}
                  showHoverBg={false}
                  titleDisplay={true}
                  trimHorizontalPaddingPx={0}
                  connectLabel="Connect Wallet"
                />
              </div>
            ) : (
              <div className="flex w-full gap-2">
                <button
                  type="submit"
                  aria-disabled={disableSubmit}
                  className={`h-[42px] flex-1 rounded px-4 py-2 text-center font-bold text-black transition-colors ${
                    disableSubmit
                      ? 'bg-red-500 text-black cursor-not-allowed'
                      : hoverTarget === 'createAccount'
                      ? hasUnsavedChanges || canCreateMissingAccount
                        ? 'bg-green-500 text-black'
                        : 'bg-red-500 text-black'
                      : 'bg-[#E5B94F] text-black'
                  }`}
                  title={
                    !hasUnsavedChanges
                      ? 'No changes detected (click to re-check)'
                      : submitLabel
                  }
                  disabled={disableSubmit}
                  onMouseEnter={() => setHoverTarget('createAccount')}
                  onMouseLeave={() => setHoverTarget(null)}
                >
                  {isSaving ? 'Saving...' : submitLabel}
                </button>
                <button
                  type="button"
                  aria-disabled={disableRevert}
                  className={`h-[42px] flex-1 rounded px-4 py-2 text-center font-bold text-black transition-colors ${
                    disableRevert
                      ? 'bg-red-500 text-black cursor-not-allowed'
                      : hoverTarget === 'revertChanges'
                      ? hasUnsavedChanges
                        ? 'bg-green-500 text-black'
                        : 'bg-red-500 text-black'
                      : 'bg-[#E5B94F] text-black'
                  }`}
                  title={
                    disableRevert || !hasUnsavedChanges
                      ? 'No changes to revert'
                      : 'Revert all pending changes'
                  }
                  disabled={disableRevert}
                  onClick={handleRevertChanges}
                  onMouseEnter={() => setHoverTarget('revertChanges')}
                  onMouseLeave={() => setHoverTarget(null)}
                >
                  Revert Changes
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Visual left panel: Users Avatar Logo */}
        <section className={`${panelMarginClass} ${avatarPanelBorderClass} order-1 flex h-full w-full flex-col items-end justify-start pr-0 pt-4 pb-4 pl-0`}>
          <h2 className="mb-4 w-full max-w-[46rem] text-center text-lg font-semibold text-[#E5B94F]">
            Users Avatar Logo
          </h2>
          <div className="flex w-full max-w-[46rem] flex-col items-center gap-4">
            <div className="flex w-full max-w-md min-h-[220px] items-center justify-center rounded border border-slate-600 bg-[#0D1324] p-4">
              {logoPreviewSrc ? (
                <img
                  src={logoPreviewSrc}
                  alt="Account logo preview"
                  className="max-h-[180px] max-w-full object-contain"
                />
              ) : (
                <span className="text-sm text-slate-300">No logo found on server</span>
              )}
            </div>
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
            {!connected ? (
              <div className="flex h-[42px] w-full max-w-md items-center justify-center rounded border border-white bg-transparent">
                <span className="text-[110%] font-normal text-red-500">Wallet Connection Required</span>
              </div>
            ) : (
              <button
                type="button"
                aria-disabled={!connected}
                className={`h-[42px] w-full max-w-md rounded px-6 py-2 text-center font-bold text-black transition-colors ${
                  hoverTarget === 'uploadLogo'
                    ? 'bg-green-500 text-black'
                    : 'bg-[#E5B94F] text-black'
                }`}
                title={previewButtonLabel}
                onClick={() => {
                  if (!logoFileInputRef.current) return;
                  logoFileInputRef.current.value = '';
                  logoFileInputRef.current.click();
                }}
                onMouseEnter={() => setHoverTarget('uploadLogo')}
                onMouseLeave={() => setHoverTarget(null)}
              >
                {previewButtonLabel}
              </button>
            )}
          </div>
        </section>
        </div>
      </form>
    </main>
  );
}
