'use client';

import { useMemo } from 'react';
import type {
  AccountFormData,
  AccountMode,
} from '../types';
import { trimForm } from '../utils';

type Params = {
  connected: boolean;
  publicKey: string;
  accountExists: boolean;
  formData: AccountFormData;
  baselineData: AccountFormData;
  logoFile: File | null;
  isLoadingAccount: boolean;
  isSaving: boolean;
  savedAccountName: string;
};

export function useCreateAccountDerivedState({
  connected,
  publicKey,
  accountExists,
  formData,
  baselineData,
  logoFile,
  isLoadingAccount,
  isSaving,
  savedAccountName,
}: Params) {
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
  const pageTitle =
    accountMode === 'create'
      ? 'Create Sponsor Coin Account'
      : `${savedAccountName}'s Account`;

  const isLoading = isLoadingAccount || isSaving;
  const isEditMode = !isLoadingAccount && !isSaving;
  const isActive = connected && !isLoading;
  const canCreateMissingAccount =
    connected && !!publicKeyTrimmed && !accountExists;
  const disableSubmit = !connected || !publicKeyTrimmed;
  const disableRevert = !connected;

  return {
    publicKeyTrimmed,
    hasDataChanges,
    hasUnsavedChanges,
    accountMode,
    submitLabel,
    isRevertNoop,
    pageTitle,
    isLoading,
    isEditMode,
    isActive,
    canCreateMissingAccount,
    disableSubmit,
    disableRevert,
  };
}
