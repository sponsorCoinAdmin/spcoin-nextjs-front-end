'use client';

import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';
import ConnectNetworkButtonProps from '@/components/views/Buttons/Connect/ConnectNetworkButton';
import { getWalletLogoURL } from '@/lib/context/helpers/assetHelpers';
import { useWalletActionOverlay } from '@/lib/context/WalletActionOverlayContext';
import {
  ACCEPTED_IMAGE_INPUT_ACCEPT,
  processImageUpload,
} from '@/lib/utils/images/imageUploadProcessor';

interface AccountFormData {
  name: string;
  symbol: string;
  email: string;
  website: string;
  description: string;
}

type AccountFormField = keyof AccountFormData;
type AccountFormErrors = Partial<Record<AccountFormField | 'publicKey', string>>;

type HoverTarget = 'createAccount' | 'uploadLogo' | 'revertChanges' | null;
type AccountMode = 'create' | 'edit' | 'update';
const DEFAULT_ACCOUNT_LOGO_URL = '/assets/miscellaneous/Anonymous.png';
const LOGO_TARGET_WIDTH_PX = 400;
const LOGO_TARGET_HEIGHT_PX = 400;
const LOGO_MAX_OUTPUT_BYTES = 500 * 1024;
const LOGO_MAX_INPUT_BYTES = 25 * 1024 * 1024;
const EMPTY_FORM_DATA: AccountFormData = {
  name: '',
  symbol: '',
  email: '',
  website: '',
  description: '',
};
const FORM_FIELDS: AccountFormField[] = [
  'name',
  'symbol',
  'email',
  'website',
  'description',
];
const FIELD_MAX_LENGTHS: Partial<Record<AccountFormField, number>> = {
  name: 50,
  symbol: 10,
  email: 256,
  website: 256,
  description: 1024,
};
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

function withCacheBust(value: string): string {
  const url = String(value ?? '').trim();
  if (!url) return url;
  const hasQuery = url.includes('?');
  const sep = hasQuery ? '&' : '?';
  return `${url}${sep}v=${Date.now()}`;
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

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidWebsite(value: string): boolean {
  if (!value) return true;
  if (value.startsWith('/assets/') || value.startsWith('assets/')) return true;
  try {
    const url = new URL(value);
    return /^https?:$/i.test(url.protocol);
  } catch {
    return false;
  }
}

function getAbsoluteFieldError(
  field: AccountFormField,
  rawValue: string,
): string | null {
  const raw = String(rawValue ?? '');
  if (field === 'name' && raw.length > 50) return 'Name too large';
  if (field === 'symbol' && raw.length > 10) return 'Symbol too large';
  return null;
}

function getFieldTooLargeMessage(field: AccountFormField): string | null {
  if (field === 'name') return 'Name too large';
  if (field === 'symbol') return 'Symbol too large';
  if (field === 'email') return 'Email too large';
  if (field === 'website') return 'Website too large';
  if (field === 'description') return 'Description too large';
  return null;
}

function isTooLargeErrorMessage(value: string | undefined): boolean {
  return typeof value === 'string' && value.toLowerCase().includes('too large');
}

function shouldBlockAdditionalInput(
  field: AccountFormField,
  currentRawValue: string,
  nextRawValue: string,
): boolean {
  const maxLen = FIELD_MAX_LENGTHS[field];
  if (!maxLen) return false;
  const currentLen = String(currentRawValue ?? '').length;
  const nextLen = String(nextRawValue ?? '').length;

  // If already over limit, only allow edits that strictly reduce total length.
  if (currentLen > maxLen) return nextLen >= currentLen;
  // Otherwise, block growth past the configured maximum.
  return nextLen > maxLen;
}

export default function CreateAccountPage() {
  const ctx = useContext(ExchangeContextState);
  const { runWithWalletAction } = useWalletActionOverlay();
  const connected = Boolean(ctx?.exchangeContext?.network?.connected);

  const [publicKey, setPublicKey] = useState<string>('');
  const [formData, setFormData] = useState<AccountFormData>({ ...EMPTY_FORM_DATA });
  const [errors, setErrors] = useState<AccountFormErrors>({});
  const [activeField, setActiveField] = useState<AccountFormField | null>(null);
  const [hoverTarget, setHoverTarget] = useState<HoverTarget>(null);
  const [hoveredInput, setHoveredInput] = useState<string | null>(null);
  const [baselineData, setBaselineData] = useState<AccountFormData>({ ...EMPTY_FORM_DATA });
  const [savedAccountName, setSavedAccountName] = useState('');
  const [accountExists, setAccountExists] = useState<boolean>(false);
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAllBorders, setShowAllBorders] = useState(false);
  const [showBorderToggleButton, setShowBorderToggleButton] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [, setHasServerLogo] = useState(false);
  const [serverLogoURL, setServerLogoURL] = useState(DEFAULT_ACCOUNT_LOGO_URL);
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const resizeDescriptionTextarea = (
    el?: HTMLTextAreaElement | null,
  ): void => {
    const target = el ?? descriptionTextareaRef.current;
    if (!target) return;
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  };

  useEffect(() => {
    const activeAddress = ctx?.exchangeContext?.accounts?.activeAccount?.address;
    setPublicKey(activeAddress ? String(activeAddress) : '');
  }, [ctx?.exchangeContext?.accounts?.activeAccount?.address]);

  useEffect(() => {
    resizeDescriptionTextarea();
  }, [formData.description]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey || event.key.toLowerCase() !== 't') return;
      event.preventDefault();
      setShowBorderToggleButton((prev) => {
        const next = !prev;
        if (next) setShowAllBorders(true);
        return next;
      });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

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
          const empty: AccountFormData = { ...EMPTY_FORM_DATA };
          setFormData(empty);
          setBaselineData(empty);
          setSavedAccountName('');
          setErrors({});
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
        setSavedAccountName(loaded.name.trim());
        setErrors({});
        setLogoFile(null);
        setHasServerLogo(Boolean(payload?.hasLogo));
        setServerLogoURL(withCacheBust(resolvedLogoURL));
      } catch {
        if (!abortController.signal.aborted) {
          setAccountExists(false);
          setSavedAccountName('');
          setErrors({});
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

  const validateField = (
    field: AccountFormField,
    rawValue: string,
  ): string | null => {
    const raw = String(rawValue ?? '');
    const value = raw.trim();
    if (field === 'name' && raw.length > 50) return 'Name too large';
    if (field === 'symbol' && raw.length > 10) return 'Symbol too large';
    if (field === 'description' && raw.length > 1024) {
      return 'Description too large';
    }
    if (field === 'email' && raw.length > 256) return 'Email too large';
    if (field === 'website' && raw.length > 256) return 'Website too large';
    if (field === 'email' && value && !isValidEmail(value)) {
      return 'Invalid email address';
    }
    if (field === 'website' && value && !isValidWebsite(value)) {
      return 'Invalid website URL';
    }
    return null;
  };

  const validatePreSend = (values: AccountFormData): AccountFormErrors => {
    const next: AccountFormErrors = {};
    if (!publicKey.trim()) next.publicKey = 'Account Public Key is required';

    for (const field of FORM_FIELDS) {
      const error = validateField(field, values[field]);
      if (error) next[field] = error;
    }
    return next;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (!isActive) return;
    const { name, value } = e.target;
    const field = name as AccountFormField;
    const nextValue = value;
    const currentValue = String(formData[field] ?? '');
    if (shouldBlockAdditionalInput(field, currentValue, nextValue)) {
      const tooLargeError = getFieldTooLargeMessage(field);
      setErrors((prev) => {
        const next = { ...prev };
        if (tooLargeError) next[field] = tooLargeError;
        return next;
      });
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: nextValue }));
    if (field === 'description' && e.target instanceof HTMLTextAreaElement) {
      resizeDescriptionTextarea(e.target);
    }
    const absoluteError = getAbsoluteFieldError(field, nextValue);
    setErrors((prev) => {
      const next = { ...prev };
      if (absoluteError) next[field] = absoluteError;
      else delete next[field];
      return next;
    });
  };

  const handleFieldFocus = (field: AccountFormField) => {
    setActiveField(field);
    const absoluteError = getAbsoluteFieldError(field, formData[field]);
    setErrors((prev) => {
      const next = { ...prev };
      if (absoluteError) next[field] = absoluteError;
      else delete next[field];
      return next;
    });
  };

  const handleFieldBlur = (field: AccountFormField) => {
    setActiveField((prev) => (prev === field ? null : prev));
    const fieldError = validateField(field, formData[field]);
    setErrors((prev) => {
      const next = { ...prev };
      if (fieldError) next[field] = fieldError;
      else delete next[field];
      return next;
    });
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

  const submitLabel = accountExists ? 'Update Account' : 'Create Account';
  const isRevertNoop = !hasUnsavedChanges;
  const accountNameForTitle = savedAccountName;
  const pageTitle =
    accountMode === 'create'
      ? 'Create Sponsor Coin Account'
      : `${accountNameForTitle}'s Account`;
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
  const isLoading = isLoadingAccount || isSaving;
  // Requested activation state: when false (loading/saving), buttons may hover-red but actions are blocked.
  const isEditMode = !isLoadingAccount && !isSaving;
  const isActive = connected && !isLoading;
  const canCreateMissingAccount =
    connected && !!publicKeyTrimmed && !accountExists;
  const disableSubmit =
    !connected ||
    !publicKeyTrimmed;
  const disableRevert = !connected;

  const handleRevertChanges = () => {
    if (!isEditMode || disableRevert || !hasUnsavedChanges) return;
    setFormData(baselineData);
    setLogoFile(null);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditMode) return;
    if (!connected) return;
    const normalizedForm = trimForm(formData);
    const nextErrors = validatePreSend(normalizedForm);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
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

      const accounts = (await runWithWalletAction(
        () =>
          eth.request({
            method: 'eth_requestAccounts',
          }),
        'MetaMask action in progress',
        'Approve the wallet account request in MetaMask to continue.',
      )) as string[];
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
        signature = (await runWithWalletAction(
          () =>
            eth.request({
              method: 'personal_sign',
              params: [message, signerAddress],
            }),
          'MetaMask action in progress',
          'Sign the authentication message in MetaMask to continue.',
        )) as string;
      } catch {
        // Provider compatibility fallback (some providers expect [address, message]).
        signature = (await runWithWalletAction(
          () =>
            eth.request({
              method: 'personal_sign',
              params: [signerAddress, message],
            }),
          'MetaMask action in progress',
          'Sign the authentication message in MetaMask to continue.',
        )) as string;
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
          const failPayload = (await accountRes.json().catch(() => ({}))) as {
            error?: string;
            details?: string;
          };
          throw new Error(
            failPayload?.error ||
              failPayload?.details ||
              'Failed to save account.json',
          );
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
          const failPayload = (await logoRes.json().catch(() => ({}))) as {
            error?: string;
            details?: string;
          };
          throw new Error(
            failPayload?.error || failPayload?.details || 'Failed to save logo.png',
          );
        }
      }

      if (shouldSaveAccount) {
        const savedForm: AccountFormData = { ...normalizedForm };
        setAccountExists(true);
        setFormData(savedForm);
        setBaselineData(savedForm);
        setSavedAccountName(savedForm.name.trim());
        setErrors({});
      }

      if (shouldSaveLogo) {
        const canonicalLogoURL = getWalletLogoURL(publicKeyTrimmed);
        setLogoFile(null);
        setHasServerLogo(true);
        setServerLogoURL(withCacheBust(canonicalLogoURL));
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

  const handleLogoFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selected = e.target.files?.[0];
    if (!selected) {
      setLogoFile(null);
      return;
    }

    try {
      const processed = await processImageUpload(selected, {
        targetWidth: LOGO_TARGET_WIDTH_PX,
        targetHeight: LOGO_TARGET_HEIGHT_PX,
        maxInputBytes: LOGO_MAX_INPUT_BYTES,
        maxOutputBytes: LOGO_MAX_OUTPUT_BYTES,
      });
      setLogoFile(processed.file);
    } catch (err) {
      setLogoFile(null);
      alert(
        err instanceof Error
          ? err.message
          : 'Unable to process image upload',
      );
    }
  };
  const baseInputClasses =
    'w-full rounded border border-white bg-[#1A1D2E] p-2 text-white focus:outline-none focus:ring-0';
  const requiredInputClasses = `${baseInputClasses} placeholder:text-red-500`;
  const optionalInputClasses = `${baseInputClasses} placeholder:text-green-400`;
  const labelCellClasses =
    'mb-0 text-right min-h-[42px] px-2 text-white flex items-center justify-end';
  const disconnectedInputMessage =
    'Connection Required and input is prohibited until connection is established.';
  const loadingInputMessage =
    'Loading or updating account data. Input is temporarily disabled.';
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
  const inputErrorClasses = 'border-red-500 bg-red-900/40';
  const loadingFieldClasses = 'bg-red-900/60 border-red-500 cursor-not-allowed';
  const inputLocked = !isActive;
  const lockedInputMessage = isLoading
    ? loadingInputMessage
    : disconnectedInputMessage;
  const getLoadingClassesForField = (fieldName: string): string =>
    isLoading && hoveredInput === fieldName ? loadingFieldClasses : '';
  const formFieldRows: Array<{
    label: string;
    name: AccountFormField;
    labelTitle: string;
  }> = [
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
  ];

  return (
    <main className="w-full p-6 text-white">
      <div className="relative mb-6 flex items-center justify-center">
        <h1 className="text-center text-2xl font-bold text-[#5981F3]">
          {pageTitle}
        </h1>
        {showBorderToggleButton ? (
          <div className="absolute right-0">
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
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="w-full">
        <div className="grid w-full items-start justify-center gap-0 grid-cols-1 lg:grid-cols-[700px_700px]">
        {/* Visual right panel: Users Account Meta Data */}
        <section className={`${panelMarginClass} ${accountPanelBorderClass} order-2 flex h-full w-full flex-col items-start justify-start pl-0 pt-4 pb-0 pr-0`}>
          <div className="mb-4 grid w-full max-w-[46rem] grid-cols-[max-content_28rem]">
            <div className="invisible h-0 overflow-hidden px-2 whitespace-nowrap">
              Account Public Key
            </div>
            <h2 className="w-full text-center text-lg font-semibold text-[#5981F3]">
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
                <div className="flex items-center gap-2">
                  <input
                    id="publicKey"
                    type="text"
                    value={publicKey}
                    readOnly
                    tabIndex={-1}
                    placeholder={
                      hoveredInput === 'publicKey'
                        ? isLoading
                          ? loadingInputMessage
                          : fieldPlaceholders.publicKey
                        : 'Required'
                    }
                    title={
                      isLoading
                        ? loadingInputMessage
                        : errors.publicKey
                        ? `Required for Code Account Operations | Error: ${errors.publicKey}`
                        : 'Required for Code Account Operations'
                    }
                    className={`${requiredInputClasses}${errors.publicKey ? ` ${inputErrorClasses}` : ''}${getLoadingClassesForField('publicKey') ? ` ${getLoadingClassesForField('publicKey')}` : ''} cursor-default select-none`}
                    style={{ cursor: 'default', caretColor: 'transparent' }}
                    onMouseDown={(e) => e.preventDefault()}
                    onFocus={(e) => e.currentTarget.blur()}
                    onMouseEnter={() => setHoveredInput('publicKey')}
                    onMouseLeave={() => setHoveredInput(null)}
                  />
                  <span
                    className={`w-4 text-center font-bold ${errors.publicKey ? 'text-red-500' : 'text-transparent'}`}
                    aria-hidden={!errors.publicKey}
                    title={errors.publicKey ? `Error: ${errors.publicKey}` : undefined}
                  >
                    X
                  </span>
                </div>
                {errors.publicKey ? (
                  <p className="mt-1 text-sm text-red-500">{errors.publicKey}</p>
                ) : null}
              </div>
            </>
          )}

          {formFieldRows.map(({ label, name, labelTitle }) => (
            <React.Fragment key={name}>
              <label
                htmlFor={name}
                className={`${labelCellClasses}${name === 'description' ? ' self-start h-auto items-start pt-2' : ''}`}
                title={labelTitle}
              >
                {label}
              </label>
              <div>
                {(() => {
                  const key = name;
                  const href = toPreviewHref(key, String(formData[key] ?? ''));
                  const isLinkField =
                    key === 'email' || key === 'website';
                  const linkLikeClass =
                    isLinkField && href
                      ? ' underline text-blue-300 cursor-pointer'
                      : '';
                  const absoluteFieldError = getAbsoluteFieldError(
                    key,
                    String(formData[key] ?? ''),
                  );
                  const fieldError =
                    activeField === key
                      ? absoluteFieldError ??
                        (isTooLargeErrorMessage(errors[key]) ? errors[key] : undefined)
                      : errors[key];
                  const inputTitle = !connected
                    ? disconnectedInputMessage
                    : isLoading
                      ? loadingInputMessage
                    : href
                      ? `${labelTitle} (click to open in Edit mode)`
                      : labelTitle;
                  const composedTitle = fieldError
                    ? `${inputTitle} | Error: ${fieldError}`
                    : inputTitle;
                  return (
                    <>
                      <div className="flex items-start gap-2">
                        {key === 'description' ? (
                          <textarea
                            id={name}
                            name={name}
                            ref={descriptionTextareaRef}
                            value={
                              connected
                                ? formData[key]
                                : ''
                            }
                            onChange={handleChange}
                            readOnly={inputLocked}
                            rows={1}
                            placeholder={
                              hoveredInput === name
                                ? inputLocked
                                  ? lockedInputMessage
                                  : fieldPlaceholders[key]
                                : 'Optional'
                            }
                            title={composedTitle}
                            className={`${optionalInputClasses} min-h-[42px] resize-none overflow-hidden whitespace-pre-wrap break-words ${fieldError ? ` ${inputErrorClasses}` : ''}${getLoadingClassesForField(name) ? ` ${getLoadingClassesForField(name)}` : ''}`}
                            onMouseEnter={() => setHoveredInput(name)}
                            onMouseLeave={() => setHoveredInput(null)}
                            onFocus={() => handleFieldFocus(key)}
                            onBlur={() => handleFieldBlur(key)}
                          />
                        ) : (
                          <input
                            id={name}
                            name={name}
                            type="text"
                            value={
                              connected
                                ? formData[key]
                                : ''
                            }
                            onChange={handleChange}
                            readOnly={inputLocked}
                            placeholder={
                              hoveredInput === name
                                ? inputLocked
                                  ? lockedInputMessage
                                  : fieldPlaceholders[key]
                                : 'Optional'
                            }
                            title={composedTitle}
                            className={`${optionalInputClasses}${linkLikeClass}${fieldError ? ` ${inputErrorClasses}` : ''}${getLoadingClassesForField(name) ? ` ${getLoadingClassesForField(name)}` : ''}`}
                            onClick={() => {
                              if (!href || accountMode !== 'edit' || inputLocked) return;
                              if (href.startsWith('mailto:')) {
                                window.location.href = href;
                                return;
                              }
                              window.open(href, '_blank', 'noopener,noreferrer');
                            }}
                            onMouseEnter={() => setHoveredInput(name)}
                            onMouseLeave={() => setHoveredInput(null)}
                            onFocus={() => handleFieldFocus(key)}
                            onBlur={() => handleFieldBlur(key)}
                          />
                        )}
                        <span
                          className={`w-4 text-center font-bold ${fieldError ? 'text-red-500' : 'text-transparent'}`}
                          aria-hidden={!fieldError}
                          title={fieldError ? `Error: ${fieldError}` : undefined}
                        >
                          X
                        </span>
                      </div>
                      {fieldError ? (
                        <p className="mt-1 text-sm text-red-500">{fieldError}</p>
                      ) : null}
                    </>
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
              <div className="flex w-[calc(100%-1.5rem)] gap-2">
                <button
                  type={!isEditMode ? 'button' : 'submit'}
                  aria-disabled={disableSubmit}
                  className={`h-[42px] flex-1 rounded px-4 py-2 text-center font-bold text-black transition-colors ${
                    !isEditMode
                      ? hoverTarget === 'createAccount'
                        ? 'bg-red-500 text-black'
                        : 'bg-[#E5B94F] text-black'
                      : disableSubmit
                      ? 'bg-red-500 text-black cursor-not-allowed'
                      : hoverTarget === 'createAccount'
                      ? hasUnsavedChanges || canCreateMissingAccount
                        ? 'bg-green-500 text-black'
                        : 'bg-red-500 text-black'
                      : 'bg-[#E5B94F] text-black'
                  }`}
                  title={
                    submitLabel === 'Update Account'
                      ? !hasUnsavedChanges
                        ? 'No changes detected (click to re-check)'
                        : submitLabel
                      : undefined
                  }
                  disabled={disableSubmit}
                  onMouseEnter={() => {
                    setHoverTarget('createAccount');
                  }}
                  onMouseLeave={() => {
                    setHoverTarget(null);
                  }}
                  onClick={() => {
                    if (!isEditMode) return;
                  }}
                >
                  {isSaving ? 'Saving...' : submitLabel}
                </button>
                <button
                  type="button"
                  aria-disabled={disableRevert}
                  className={`h-[42px] flex-1 rounded px-4 py-2 text-center font-bold text-black transition-colors ${
                    isRevertNoop
                      ? 'bg-[#E5B94F] text-black hover:bg-[#E5B94F] transition-none cursor-default'
                      : !isEditMode
                      ? hoverTarget === 'revertChanges'
                        ? 'bg-red-500 text-black'
                        : 'bg-[#E5B94F] text-black'
                      : disableRevert
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
                  onClick={() => {
                    if (isRevertNoop) return;
                    handleRevertChanges();
                  }}
                  onMouseEnter={() => {
                    if (isRevertNoop) return;
                    setHoverTarget('revertChanges');
                  }}
                  onMouseLeave={() => {
                    if (isRevertNoop) return;
                    setHoverTarget(null);
                  }}
                >
                  Revert Changes
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Visual left panel: Users Avatar Logo */}
        <section className={`${panelMarginClass} ${avatarPanelBorderClass} order-1 flex h-full w-full flex-col items-end justify-start pr-0 pt-4 pb-0 pl-0`}>
          <h2 className="mb-4 w-full max-w-[46rem] text-center text-lg font-semibold text-[#5981F3]">
            Users Avatar
          </h2>
          <div className="flex h-full w-full flex-1 min-h-0 flex-col items-center gap-4">
            <div className="flex h-full w-full max-w-[46rem] flex-1 min-h-0 flex-col items-center gap-4">
              <div className="flex w-full max-w-md flex-col gap-4">
                <div className="mx-auto flex h-[332px] w-[332px] items-center justify-center overflow-hidden rounded border border-slate-600 bg-[#0D1324] p-0">
                  {logoPreviewSrc ? (
                    <img
                      src={logoPreviewSrc}
                      alt="Account logo preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm text-slate-300">No logo found on server</span>
                  )}
                </div>
                <input
                  ref={logoFileInputRef}
                  id="logoFileUpload"
                  type="file"
                  accept={ACCEPTED_IMAGE_INPUT_ACCEPT}
                  className="hidden"
                  aria-label="Account logo file upload"
                  title="Select account logo file"
                  onChange={handleLogoFileChange}
                />
                <div className="w-full">
                  {!connected ? (
                    <div className="flex h-[42px] w-full items-center justify-center rounded border border-white bg-transparent">
                      <span className="text-[110%] font-normal text-red-500">Wallet Connection Required</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      aria-disabled={!connected}
                      disabled={!connected}
                      className={`h-[42px] w-full rounded px-6 py-2 text-center font-bold text-black transition-colors ${
                        !isEditMode
                          ? hoverTarget === 'uploadLogo'
                            ? 'bg-red-500 text-black'
                            : 'bg-[#E5B94F] text-black'
                          : inputLocked
                          ? 'bg-red-500 text-black cursor-not-allowed'
                          : hoverTarget === 'uploadLogo'
                          ? 'bg-green-500 text-black'
                          : 'bg-[#E5B94F] text-black'
                      }`}
                      title={isLoading ? loadingInputMessage : previewButtonLabel}
                      onClick={() => {
                        if (!isEditMode || inputLocked) return;
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
              </div>
            </div>
          </div>
        </section>
        </div>
      </form>
    </main>
  );
}

