// File: lib/hooks/inputValidations/helpers/startFSM.ts
'use client';

import { MutableRefObject } from 'react';
import {
  SP_COIN_DISPLAY,
  FEED_TYPE,
  WalletAccount,
  TokenContract,
} from '@/lib/structure';
import { InputState } from '@/lib/structure/assetSelection';

import { validateFSMCore } from '../../FSM_Core/validateFSMCore';
import type { ValidateFSMInput } from '../../FSM_Core/types/validateFSMTypes';

import { Address, zeroAddress } from 'viem';
import { isTriggerFSMState } from '../../FSM_Core/fSMInputStates';
import { runFSM } from './runFSM';
import { createTraceSink } from './internals/sinks';
import { makeSignature, signatureDiff, shouldRunFSM } from './internals/guards';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { getStateIcon } from './internals/debugFSM';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_FSM === 'true';
const TRACE_ENABLED = process.env.NEXT_PUBLIC_FSM_INPUT_STATE_TRACE === 'true';
const debug = createDebugLogger('startFSM', DEBUG_ENABLED);

export type StartFSMArgs = {
  debouncedHexInput: string;
  prevDebouncedInputRef: MutableRefObject<string | undefined>;
  publicClient: any;
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

export async function startFSM(args: StartFSMArgs): Promise<StartFSMResult> {
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

  if (DEBUG_ENABLED) {
    debug.log(
      `↪️ enter: input="${debouncedHexInput || '(empty)'}", isValid=${isValid}, failed="${failedHexInput ?? '—'}", ` +
        `manual=${String(manualEntry)}, peer=${peerAddress ?? '—'}, chainId=${chainId}`
    );
  }

  if (!publicClient || !chainId) {
    debug.warn('⛔ Missing publicClient/chainId — skipping FSM run.');
    return null;
  }

  const newSignature = makeSignature(debouncedHexInput, isValid);
  const canRun = shouldRunFSM(prevDebouncedInputRef, newSignature);

  if (!canRun) {
    if (DEBUG_ENABLED) debug.log(`⏸️ Unchanged signature "${newSignature}" — skipping FSM run.`);
    return null;
  }

  if (DEBUG_ENABLED) {
    const reason = signatureDiff(prevDebouncedInputRef.current, newSignature);
    debug.log(`▶️ Triggering FSM${reason ? `: ${reason}` : ''}`);
  }

  // update signature after we decide to run
  prevDebouncedInputRef.current = newSignature;

  // pick a trace sink (no-op when TRACE_ENABLED is false; lazily loads heavy code when true)
  const traceSink = await createTraceSink(TRACE_ENABLED, {
    containerType,
    debouncedHexInput,
    feedType,
  });

  // Build the ValidateFSMInput the core expects (side-effects neutralized except closePanelCallback)
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

  // Run the pure FSM loop
  const { finalState, assetAcc, transitions } = await runFSM({
    initialState: InputState.VALIDATE_ADDRESS,
    current,
    isTriggerFSMState,
    validateFSMCore,
    maxSteps: 30,
    onTransition(prev, next) {
      // debug log per transition
      if (DEBUG_ENABLED) {
        // eslint-disable-next-line no-console
        console.log(
          `🟢 ${getStateIcon(prev)} ${InputState[prev]} → ${getStateIcon(next)} ${InputState[next]} (FSM)`
        );
      }
      traceSink.onTransition(prev, next);
    },
  });

  // finalize trace (pretty-print + persist when enabled)
  traceSink.onFinish(finalState);

  if (DEBUG_ENABLED) {
    const addr = (assetAcc as any)?.address ?? '—';
    const sym = (assetAcc as any)?.symbol ?? '—';
    const nm = (assetAcc as any)?.name ?? '—';
    debug.log(`🏁 finalState → ${InputState[finalState]} | asset: { address: ${addr}, symbol: ${sym}, name: ${nm} }`);
  }

  // Surface asset only for preview/commit states
  const isCommit =
    finalState === InputState.UPDATE_VALIDATED_ASSET ||
    finalState === InputState.CLOSE_SELECT_PANEL;
  const isPreview = finalState === InputState.VALIDATE_PREVIEW;
  const hasAddr = Boolean((assetAcc as any).address);

  return hasAddr && (isPreview || isCommit)
    ? { finalState, asset: assetAcc as WalletAccount | TokenContract }
    : { finalState };
}
