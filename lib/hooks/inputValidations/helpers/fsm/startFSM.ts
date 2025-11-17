// File: lib/hooks/inputValidations/helpers/startFSM.ts
'use client';

import type { MutableRefObject } from 'react';
import type {
  SP_COIN_DISPLAY,
  WalletAccount,
  TokenContract,
} from '@/lib/structure';
import { FEED_TYPE } from '@/lib/structure';
import { InputState } from '@/lib/structure/assetSelection';

import { validateFSMCore } from '../../validateFSMCore';
import type {
  ValidateFSMInput,
  ValidateFSMOutput,
} from '../../FSM_Core/types/validateFSMTypes';

import type { Address } from 'viem';
import { zeroAddress } from 'viem';

import { isTriggerFSMState } from '../../FSM_Core/fSMInputStates';
import { makeSignature, shouldRunFSM } from './internals/guards';

type PublicClientLike = unknown;

export type StartFSMArgs = {
  debouncedHexInput: string;
  prevDebouncedInputRef: MutableRefObject<string | undefined>;
  publicClient: PublicClientLike | null | undefined;
  chainId: number;
  accountAddress?: string;

  containerType: SP_COIN_DISPLAY;
  feedType: FEED_TYPE;

  manualEntry?: boolean;
  peerAddress?: string;

  isValid: boolean;
  failedHexInput?: string;

  closePanelCallback: (fromUser: boolean) => void;
};

export type StartFSMResult =
  | {
      finalState: InputState;
      asset?: WalletAccount | TokenContract;
    }
  | null;

export async function startFSM(
  args: StartFSMArgs,
): Promise<StartFSMResult> {
  const {
    debouncedHexInput,
    prevDebouncedInputRef,
    publicClient,
    chainId,
    accountAddress,
    containerType,
    feedType,
    peerAddress,
    manualEntry,
    isValid,
    failedHexInput,
    closePanelCallback,
  } = args;

  // Basic guard: nothing to do without a client/chain
  if (!publicClient || !chainId) {
    return null;
  }

  // Debounce / signature gating: don't rerun FSM if input+validity didn't change
  const newSignature = makeSignature(debouncedHexInput, isValid);
  const canRun = shouldRunFSM(prevDebouncedInputRef, newSignature);
  if (!canRun) {
    return null;
  }
  prevDebouncedInputRef.current = newSignature;

  const noop = () => {};
  const current: ValidateFSMInput = {
    inputState: InputState.VALIDATE_ADDRESS,
    debouncedHexInput,

    isValid,
    failedHexInput,

    containerType,
    feedType,
    chainId,
    publicClient,
    accountAddress: (accountAddress ?? zeroAddress) as Address,

    manualEntry: manualEntry ?? true,
    peerAddress,

    setValidatedAsset: noop,
    setTradingTokenCallback: noop,
    closePanelCallback,

    seenBrokenLogos: new Set<string>(),
    resolvedAsset: undefined,
  };

  // ─────────────────────────────────────────────
  // Inline FSM loop (previously runFSM)
  // ─────────────────────────────────────────────
  let state = InputState.VALIDATE_ADDRESS;
  const assetAcc: Partial<TokenContract | WalletAccount> = {};
  let seeded = false;
  const maxSteps = 30;

  const mergeAssetPatch = (
    patch?: Partial<TokenContract | WalletAccount>,
  ) => {
    if (!patch) return;

    const incAddr = (patch as any)?.address
      ?.toString?.()
      .toLowerCase?.();
    const curAddr = (assetAcc as any)?.address
      ?.toString?.()
      .toLowerCase?.();

    // Seed base address once
    if (!curAddr && (patch as any)?.address) {
      (assetAcc as any).address = (patch as any).address as Address;
    }

    // Ignore patches that try to change the address
    if (incAddr && curAddr && incAddr !== curAddr) return;

    for (const [k, v] of Object.entries(patch)) {
      if ((assetAcc as any)[k] == null) {
        (assetAcc as any)[k] = v as any;
      }
    }
  };

  for (let steps = 0; steps < maxSteps; steps++) {
    current.inputState = state;

    if (!isTriggerFSMState(state)) break;

    current.resolvedAsset = assetAcc;

    const result: ValidateFSMOutput = await validateFSMCore(current);
    const next = result.nextState;

    if (
      !seeded &&
      state === InputState.VALIDATE_ADDRESS &&
      next !== InputState.VALIDATE_ADDRESS
    ) {
      (assetAcc as any).address =
        current.debouncedHexInput as any as Address;
      (assetAcc as any).chainId = current.chainId as any;
      seeded = true;
    }

    mergeAssetPatch((result as any).assetPatch);
    mergeAssetPatch((result as any).validatedAsset);

    if (next === state) break;

    state = next;
  }

  const finalState = state;
  const committedAsset =
    (assetAcc as WalletAccount | TokenContract | undefined);
  const hasAddr = Boolean((committedAsset as any)?.address);

  const isCommit =
    finalState === InputState.UPDATE_VALIDATED_ASSET ||
    finalState === InputState.CLOSE_SELECT_PANEL;
  const isPreview = finalState === InputState.VALIDATE_PREVIEW;

  // Preserve manualEntry gating: manual text entry never directly commits
  if (isCommit && current.manualEntry) {
    return { finalState };
  }

  return hasAddr && (isPreview || isCommit)
    ? { finalState, asset: committedAsset }
    : { finalState };
}
