'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Wallet } from 'ethers';
import { getAccountLogoURL } from '@/lib/context/helpers/assetHelpers';
import type { AccountRegistryRecord } from '@/lib/context/accounts/accountRegistry';
import {
  loadAccountRecord,
  saveAccountLogo,
  saveAccountRecord,
} from '@/lib/context/accounts/accountStore';
import type { AccountFormData, AccountFormErrors, AccountFormField } from '../types';
import {
  DEFAULT_ACCOUNT_LOGO_URL,
  EMPTY_FORM_DATA,
  FORM_ERROR_FOCUS_ORDER,
  FORM_FIELDS,
} from '../utils';
import {
  ensureAbsoluteAssetURL,
  getAbsoluteFieldError,
  getFieldTooLargeMessage,
  isValidEmail,
  isValidWebsite,
  normalizeAddress,
  shouldBlockAdditionalInput,
  trimForm,
  withCacheBust,
} from '../utils';
import { processCreateAccountLogoUpload } from '../utils/imageUpload';
import { useCreateAccountDerivedState } from './useCreateAccountDerivedState';
import { isConfiguredOwnerAdminAddress } from '@/lib/utils/accounts/ownerAdmin';

type RunWithWalletAction = <T>(
  action: () => Promise<T>,
  title?: string,
  message?: string,
) => Promise<T>;

type Params = {
  connected: boolean;
  activeAddress?: string;
  targetAddress?: string;
  authSignerSource: 'ec2-base' | 'metamask';
  hardhatDeploymentAccountNumber?: number;
  appChainId?: number;
  hardhatSignerAvailable?: boolean;
  runWithWalletAction: RunWithWalletAction;
};

function isAddress(value: string): boolean {
  return /^0[xX][0-9a-fA-F]{40}$/.test(String(value ?? '').trim());
}

export function useCreateAccountForm({
  connected,
  activeAddress,
  targetAddress,
  authSignerSource,
  hardhatDeploymentAccountNumber = 0,
  appChainId,
  hardhatSignerAvailable,
  runWithWalletAction,
}: Params) {
  const [publicKey, setPublicKey] = useState<string>('');
  const [formData, setFormData] = useState<AccountFormData>({ ...EMPTY_FORM_DATA });
  const [errors, setErrors] = useState<AccountFormErrors>({});
  const [errorFocusTick, setErrorFocusTick] = useState(0);
  const [baselineData, setBaselineData] = useState<AccountFormData>({
    ...EMPTY_FORM_DATA,
  });
  const [savedAccountName, setSavedAccountName] = useState('');
  const [accountExists, setAccountExists] = useState<boolean>(false);
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [resolvedAccountAddress, setResolvedAccountAddress] = useState<string>('');
  const [invalidAddressPopupPreviousAddress, setInvalidAddressPopupPreviousAddress] =
    useState<string | null>(null);
  const [, setHasServerLogo] = useState(false);
  const [serverLogoURL, setServerLogoURL] = useState(DEFAULT_ACCOUNT_LOGO_URL);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const resizeDescriptionTextarea = (el?: HTMLTextAreaElement | null): void => {
    const target = el ?? descriptionTextareaRef.current;
    if (!target) return;
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  };

  const resetLoadedAccountState = () => {
    setPublicKey('');
    setFormData({ ...EMPTY_FORM_DATA });
    setBaselineData({ ...EMPTY_FORM_DATA });
    setSavedAccountName('');
    setAccountExists(false);
    setResolvedAccountAddress('');
    setErrors({});
    setLogoFile(null);
    setHasServerLogo(false);
    setServerLogoURL(DEFAULT_ACCOUNT_LOGO_URL);
  };

  const requestedTargetAddress = useMemo(
    () => (isAddress(String(targetAddress ?? '').trim()) ? normalizeAddress(String(targetAddress)) : ''),
    [targetAddress],
  );
  const normalizedActiveAddress = useMemo(
    () => (isAddress(String(activeAddress ?? '').trim()) ? normalizeAddress(String(activeAddress)) : ''),
    [activeAddress],
  );
  const canUseHardhatSigner = hardhatSignerAvailable ?? (Number(appChainId) === 31337);
  const initialAccountAddress = useMemo(() => {
    if (authSignerSource === 'metamask') {
      return normalizedActiveAddress;
    }
    return requestedTargetAddress || normalizedActiveAddress;
  }, [authSignerSource, normalizedActiveAddress, requestedTargetAddress]);
  const isAuthSessionAvailable = connected || (authSignerSource === 'ec2-base' && canUseHardhatSigner);

  useEffect(() => {
    if (!initialAccountAddress) {
      if (authSignerSource === 'ec2-base' && canUseHardhatSigner) return;
    }
    setPublicKey(initialAccountAddress);
  }, [authSignerSource, canUseHardhatSigner, initialAccountAddress]);

  useEffect(() => {
    const keepHardhatSelection =
      authSignerSource === 'ec2-base' && canUseHardhatSigner;
    if (keepHardhatSelection) return;
    if (initialAccountAddress) return;
    resetLoadedAccountState();
  }, [authSignerSource, canUseHardhatSigner, initialAccountAddress]);

  useEffect(() => {
    resizeDescriptionTextarea();
  }, [formData.description]);

  useEffect(() => {
    if (!isAuthSessionAvailable || !initialAccountAddress) return;

    const abortController = new AbortController();

    const hydrateAccount = async () => {
      setIsLoadingAccount(true);
      try {
        const normalizedAddress = initialAccountAddress;
        const record = (await loadAccountRecord(normalizedAddress, {
          forceRefresh: true,
          signal: abortController.signal,
        })) as AccountRegistryRecord;
        if (abortController.signal.aborted) return;

        const resolvedLogoURL = ensureAbsoluteAssetURL(
          String((record as any)?.logoURL ?? DEFAULT_ACCOUNT_LOGO_URL),
        );

        const loaded: AccountFormData = {
          name: typeof record.name === 'string' ? record.name : '',
          symbol: typeof record.symbol === 'string' ? record.symbol : '',
          email: typeof record.email === 'string' ? record.email : '',
          website: typeof record.website === 'string' ? record.website : '',
          description:
            typeof record.description === 'string' ? record.description : '',
          recipientNetwork: Array.isArray((record as any)?.recipientNetwork)
            ? Array.from(
                new Set(
                  ((record as any).recipientNetwork as unknown[])
                    .map((value) => Number(value))
                    .filter((value) => Number.isFinite(value)),
                ),
              )
            : [],
        };

        setPublicKey(normalizedAddress);
        setResolvedAccountAddress(normalizedAddress);
        setAccountExists(true);
        setFormData(loaded);
        setBaselineData(loaded);
        setSavedAccountName(loaded.name.trim());
        setErrors({});
        setLogoFile(null);
        setHasServerLogo(
          resolvedLogoURL !== DEFAULT_ACCOUNT_LOGO_URL &&
            !resolvedLogoURL.endsWith('/assets/miscellaneous/Anonymous.png'),
        );
        setServerLogoURL(withCacheBust(resolvedLogoURL));
      } catch {
        if (!abortController.signal.aborted) {
          setPublicKey(initialAccountAddress);
          setResolvedAccountAddress(initialAccountAddress);
          setAccountExists(false);
          setFormData({ ...EMPTY_FORM_DATA });
          setBaselineData({ ...EMPTY_FORM_DATA });
          setSavedAccountName('');
          setErrors({});
          setLogoFile(null);
          setHasServerLogo(false);
          setServerLogoURL(DEFAULT_ACCOUNT_LOGO_URL);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingAccount(false);
        }
      }
    };

    void hydrateAccount();
    return () => abortController.abort();
  }, [initialAccountAddress, isAuthSessionAvailable]);

  const validateField = (field: AccountFormField, rawValue: string): string | null => {
    const raw = String(rawValue ?? '');
    const value = raw.trim();
    if (field === 'name' && raw.length > 50) return 'Name too large';
    if (field === 'symbol' && raw.length > 10) return 'Symbol too large';
    if (field === 'description' && raw.length > 1024) return 'Description too large';
    if (field === 'email' && raw.length > 256) return 'Email too large';
    if (field === 'website' && raw.length > 256) return 'Website too large';
    if (field === 'email' && value && !isValidEmail(value)) return 'Invalid email address';
    if (field === 'website' && value && !isValidWebsite(value)) return 'Invalid website URL';
    return null;
  };

  const validatePreSend = (values: AccountFormData): AccountFormErrors => {
    const next: AccountFormErrors = {};
    if (!publicKey.trim()) next.publicKey = 'Account Address is required';
    for (const field of FORM_FIELDS) {
      const error = validateField(field, values[field]);
      if (error) next[field] = error;
    }
    return next;
  };

  const derived = useCreateAccountDerivedState({
    connected: isAuthSessionAvailable,
    publicKey,
    accountExists,
    formData,
    baselineData,
    logoFile,
    isLoadingAccount,
    isSaving,
    savedAccountName,
  });

  const loadAccountByAddress = async (nextAddress: string, previousAddress: string) => {
    const normalizedAddress = normalizeAddress(nextAddress);
    if (normalizedAddress === previousAddress) {
      setPublicKey(normalizedAddress);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.publicKey;
        return next;
      });
      return;
    }

    setIsLoadingAccount(true);
    try {
      const record = (await loadAccountRecord(normalizedAddress, {
        forceRefresh: true,
      })) as AccountRegistryRecord;
      const resolvedLogoURL = ensureAbsoluteAssetURL(
        String((record as any)?.logoURL ?? DEFAULT_ACCOUNT_LOGO_URL),
      );
      const loaded: AccountFormData = {
        name: typeof record.name === 'string' ? record.name : '',
        symbol: typeof record.symbol === 'string' ? record.symbol : '',
        email: typeof record.email === 'string' ? record.email : '',
        website: typeof record.website === 'string' ? record.website : '',
        description:
          typeof record.description === 'string' ? record.description : '',
        recipientNetwork: Array.isArray((record as any)?.recipientNetwork)
          ? Array.from(
              new Set(
                ((record as any).recipientNetwork as unknown[])
                  .map((value) => Number(value))
                  .filter((value) => Number.isFinite(value)),
              ),
            )
          : [],
      };

      setPublicKey(normalizedAddress);
      setResolvedAccountAddress(normalizedAddress);
      setAccountExists(true);
      setFormData(loaded);
      setBaselineData(loaded);
      setSavedAccountName(loaded.name.trim());
      setErrors({});
      setLogoFile(null);
      setHasServerLogo(
        resolvedLogoURL !== DEFAULT_ACCOUNT_LOGO_URL &&
          !resolvedLogoURL.endsWith('/assets/miscellaneous/Anonymous.png'),
      );
      setServerLogoURL(withCacheBust(resolvedLogoURL));
    } catch {
      setPublicKey(normalizedAddress);
      setResolvedAccountAddress(normalizedAddress);
      setAccountExists(false);
      setFormData({ ...EMPTY_FORM_DATA });
      setBaselineData({ ...EMPTY_FORM_DATA });
      setSavedAccountName('');
      setLogoFile(null);
      setHasServerLogo(false);
      setServerLogoURL(DEFAULT_ACCOUNT_LOGO_URL);
      setErrors((prev) => {
        const next = { ...prev };
        next.publicKey = 'Account not found';
        return next;
      });
    } finally {
      setIsLoadingAccount(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!derived.isActive) return;
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

  const handlePublicKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!derived.isActive) return;
    setPublicKey(e.target.value);
    setErrors((prev) => {
      if (!prev.publicKey) return prev;
      const next = { ...prev };
      delete next.publicKey;
      return next;
    });
  };

  const handlePublicKeyBlur = async () => {
    const previousAddress = resolvedAccountAddress || initialAccountAddress;
    const trimmed = String(publicKey ?? '').trim();

    if (!trimmed) {
      setPublicKey(previousAddress);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.publicKey;
        return next;
      });
      return;
    }

    if (!isAddress(trimmed)) {
      setInvalidAddressPopupPreviousAddress(previousAddress);
      setErrors((prev) => {
        const next = { ...prev };
        next.publicKey = 'Invalid account address';
        return next;
      });
      return;
    }

    await loadAccountByAddress(trimmed, previousAddress);
  };

  const handleSelectPublicKey = async (nextAddress: string) => {
    const trimmed = String(nextAddress ?? '').trim();
    const previousAddress = resolvedAccountAddress || initialAccountAddress;
    if (!trimmed || !isAddress(trimmed)) return;
    await loadAccountByAddress(trimmed, previousAddress);
  };

  const handleInvalidAddressContinue = () => {
    setInvalidAddressPopupPreviousAddress(null);
    setErrors((prev) => {
      const next = { ...prev };
      next.publicKey = 'Invalid account address';
      return next;
    });
  };

  const handleInvalidAddressRevert = () => {
    if (invalidAddressPopupPreviousAddress) {
      setPublicKey(invalidAddressPopupPreviousAddress);
    }
    setInvalidAddressPopupPreviousAddress(null);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.publicKey;
      return next;
    });
  };

  const handleFieldBlur = (field: AccountFormField) => {
    const fieldError = validateField(field, formData[field]);
    setErrors((prev) => {
      const next = { ...prev };
      if (fieldError) next[field] = fieldError;
      else delete next[field];
      return next;
    });
  };

  const handleRevertChanges = () => {
    if (!derived.isEditMode || derived.disableRevert || !derived.hasUnsavedChanges) return;
    setFormData(baselineData);
    setLogoFile(null);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!derived.isEditMode) return;
    if (!isAuthSessionAvailable) return;
    const normalizedForm = trimForm(formData);
    const nextErrors = validatePreSend(normalizedForm);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setErrorFocusTick((prev) => prev + 1);
      return;
    }
    if (!derived.publicKeyTrimmed) return;
    if (!derived.hasUnsavedChanges && accountExists) {
      return;
    }

    setIsSaving(true);
    try {
      const normalizedTargetAddress = normalizeAddress(derived.publicKeyTrimmed);
      let signerAddress = '';
      let signMessage: ((message: string) => Promise<string>) | null = null;

      if (authSignerSource === 'ec2-base' && canUseHardhatSigner) {
        const response = await fetch('/assets/spCoinLab/networks/31337/testAccounts.json', {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error('Unable to load Hardhat signing accounts.');
        }
        const entries = (await response.json()) as Array<{ address?: string; privateKey?: string }>;
        const selectedSignerEntry =
          Number.isInteger(hardhatDeploymentAccountNumber) &&
          hardhatDeploymentAccountNumber >= 0 &&
          hardhatDeploymentAccountNumber < entries.length
            ? entries[hardhatDeploymentAccountNumber]
            : undefined;
        const signerEntry =
          (selectedSignerEntry &&
          normalizeAddress(String(selectedSignerEntry?.address ?? '')) === normalizedTargetAddress &&
          /^0x[a-fA-F0-9]{64}$/.test(String(selectedSignerEntry?.privateKey ?? '').trim())
            ? selectedSignerEntry
            : undefined) ??
          entries.find(
            (entry) =>
              normalizeAddress(String(entry?.address ?? '')) === normalizedTargetAddress &&
              /^0x[a-fA-F0-9]{64}$/.test(String(entry?.privateKey ?? '').trim()),
          ) ??
          entries.find(
            (entry) =>
              normalizeAddress(String(entry?.address ?? '')) === normalizedActiveAddress &&
              /^0x[a-fA-F0-9]{64}$/.test(String(entry?.privateKey ?? '').trim()),
          );

        const privateKey = String(signerEntry?.privateKey ?? '').trim();
        const hardhatSignerAddress = String(signerEntry?.address ?? '').trim();
        if (!privateKey || !hardhatSignerAddress) {
          throw new Error('Missing Hardhat private key for this account.');
        }

        signerAddress = normalizeAddress(hardhatSignerAddress);
        const wallet = new Wallet(privateKey);
        signMessage = async (message: string) => await wallet.signMessage(message);
      } else {
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
          'Approve the account request in MetaMask to continue.',
        )) as string[];
        signerAddress = String(accounts?.[0] ?? '').trim();
        if (!signerAddress) {
          throw new Error('No MetaMask account available for signing');
        }

        signMessage = async (message: string) => {
          try {
            return (await runWithWalletAction(
              () =>
                eth.request({
                  method: 'personal_sign',
                  params: [message, signerAddress],
                }),
              'MetaMask action in progress',
              'Sign the authentication message in MetaMask to continue.',
            )) as string;
          } catch {
            return (await runWithWalletAction(
              () =>
                eth.request({
                  method: 'personal_sign',
                  params: [signerAddress, message],
                }),
              'MetaMask action in progress',
              'Sign the authentication message in MetaMask to continue.',
            )) as string;
          }
        };
      }

      if (!signMessage) {
        throw new Error('No signing method available.');
      }

      const nonceRes = await fetch('/api/spCoin/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: signerAddress }),
      });
      if (!nonceRes.ok) {
        let serverError = '';
        try {
          const payload = (await nonceRes.json()) as { error?: string; details?: string };
          serverError = String(payload?.error ?? payload?.details ?? '').trim();
        } catch {
          serverError = '';
        }
        const statusHint =
          nonceRes.status === 429
            ? 'Too many auth attempts. Please wait and try again.'
            : nonceRes.status === 503
            ? 'Server auth is not configured.'
            : '';
        const message = serverError || statusHint || `Nonce request failed (HTTP ${nonceRes.status})`;
        throw new Error(message);
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

      const signature = await signMessage(message);
      if (!signature) {
        throw new Error('Signature request rejected');
      }

      const normalizedSignerAddress = normalizeAddress(signerAddress || normalizedTargetAddress);
      const signerCanEditTarget =
        normalizedSignerAddress === normalizedTargetAddress ||
        isConfiguredOwnerAdminAddress(normalizedSignerAddress);
      if (!signerCanEditTarget) {
        const signerLabel = authSignerSource === 'ec2-base' ? 'Hardhat EC2' : 'MetaMask';
        throw new Error(
          `Connected account mismatch. ${signerLabel}=${normalizedSignerAddress}, Target=${derived.publicKeyTrimmed}`,
        );
      }

      const verifyRes = await fetch('/api/spCoin/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: normalizedSignerAddress,
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
          failPayload?.error || failPayload?.details || 'Signature verification failed',
        );
      }
      const verifyPayload = (await verifyRes.json()) as { token?: string };
      const authToken = String(verifyPayload?.token ?? '');
      if (!authToken) {
        throw new Error('Missing auth token');
      }

      const shouldSaveAccount = derived.hasDataChanges || !accountExists;
      const shouldSaveLogo = Boolean(logoFile);

      if (shouldSaveAccount) {
        const accountPayload = {
          address: derived.publicKeyTrimmed,
          name: normalizedForm.name,
          symbol: normalizedForm.symbol,
          email: normalizedForm.email,
          website: normalizedForm.website,
          description: normalizedForm.description,
          recipientNetwork: normalizedForm.recipientNetwork,
        };
        const saveMethod = accountExists ? 'PUT' : 'POST';
        await saveAccountRecord(
          derived.publicKeyTrimmed,
          accountPayload,
          authToken,
          saveMethod,
        );
      }

      if (shouldSaveLogo && logoFile) {
        const logoForm = new FormData();
        logoForm.append('file', logoFile);
        await saveAccountLogo(derived.publicKeyTrimmed, logoForm, authToken);
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
        const canonicalLogoURL = getAccountLogoURL(derived.publicKeyTrimmed);
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

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) {
      setLogoFile(null);
      return;
    }

    try {
      const processed = await processCreateAccountLogoUpload(selected);
      setLogoFile(processed.file);
    } catch (err) {
      setLogoFile(null);
      alert(err instanceof Error ? err.message : 'Unable to process image upload');
    }
  };

  useEffect(() => {
    if (!derived.isActive) return;
    const firstErrorField = FORM_ERROR_FOCUS_ORDER.find((field) => Boolean(errors[field]));
    if (!firstErrorField) return;
    const element = document.getElementById(firstErrorField) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | null;
    if (!element || element.readOnly) return;
    element.focus();
  }, [errorFocusTick, errors, derived.isActive]);

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

  return {
    publicKey,
    formData,
    errors,
    savedAccountName,
    accountExists,
    isLoadingAccount,
    isSaving,
    logoFileInputRef,
    descriptionTextareaRef,
    serverLogoURL,
    setFormData,
    setErrors,
    handleChange,
    handleFieldBlur,
    handlePublicKeyChange,
    handlePublicKeyBlur,
    handleSelectPublicKey,
    handleRevertChanges,
    handleSubmit,
    handleLogoFileChange,
    logoPreviewSrc,
    invalidAddressPopupPreviousAddress,
    handleInvalidAddressContinue,
    handleInvalidAddressRevert,
    ...derived,
  };
}
