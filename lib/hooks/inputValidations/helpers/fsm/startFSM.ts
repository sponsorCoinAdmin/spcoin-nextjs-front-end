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

// 🔽 ensure logoURL is present at commit time
import { getLogoURL, defaultMissingImage } from '@/lib/context/helpers/NetworkHelpers';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_FSM === 'true';
const TRACE_ENABLED = process.env.NEXT_PUBLIC_FSM_INPUT_STATE_TRACE === 'true';
const debug = createDebugLogger('startFSM', DEBUG_ENABLED);

/** Safely read the connected chain id from a wagmi/viem publicClient */
async function getClientChainIdSafe(client: any): Promise<number | undefined> {
  try {
    if (client?.chain?.id != null) return Number(client.chain.id);
    if (typeof client?.getChainId === 'function') return await client.getChainId();
  } catch {}
  return undefined;
}

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
    console.log(
      `↪️ enter: input="${debouncedHexInput || '(empty)'}", isValid=${isValid}, failed="${
        failedHexInput ?? '—'
      }", manual=${String(manualEntry)}, peer=${peerAddress ?? '—'}, chainId=${chainId}`
    );
  }

  if (!publicClient || !chainId) {
    debug.warn('⛔ Missing publicClient/chainId — skipping FSM run.');
    return null;
  }

  // Preflight: log if the provided publicClient is on the wrong chain
  const clientChainId = await getClientChainIdSafe(publicClient);
  if (clientChainId !== undefined && clientChainId !== chainId) {
    debug.warn(
      '⚠️ publicClient chain mismatch — fix caller to use usePublicClient({ chainId })',
      { expectedChainId: chainId, clientChainId } as any
    );
    // NOTE: We *do not* bail here; we continue running to preserve behavior.
  }

  const newSignature = makeSignature(debouncedHexInput, isValid);
  const canRun = shouldRunFSM(prevDebouncedInputRef, newSignature);

  if (!canRun) {
    if (DEBUG_ENABLED) console.log(`⏸️ Unchanged signature "${newSignature}" — skipping FSM run.`);
    return null;
  }

  if (DEBUG_ENABLED) {
    const reason = signatureDiff(prevDebouncedInputRef.current, newSignature);
    console.log(`▶️ Triggering FSM${reason ? `: ${reason}` : ''}`);
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
  const { finalState, assetAcc } = await runFSM({
    initialState: InputState.VALIDATE_ADDRESS,
    current,
    isTriggerFSMState,
    validateFSMCore,
    maxSteps: 30,
    onTransition(prev, next) {
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

  // Before logging/returning, ensure a logoURL is present for token-list assets.
  let committedAsset: WalletAccount | TokenContract | undefined = assetAcc as
    | WalletAccount
    | TokenContract
    | undefined;

  const hasAddr = Boolean((committedAsset as any)?.address);

  if (
    hasAddr &&
    feedType === FEED_TYPE.TOKEN_LIST &&
    (committedAsset as TokenContract) &&
    !(committedAsset as TokenContract).logoURL
  ) {
    const addr = (committedAsset as TokenContract).address as Address;
    try {
      const url = await getLogoURL(chainId, addr, FEED_TYPE.TOKEN_LIST);
      const finalURL = url || defaultMissingImage;
      committedAsset = {
        ...(committedAsset as TokenContract),
        logoURL: finalURL,
      };
      if (DEBUG_ENABLED) {
        console.log('🖼️ Filled missing logoURL at commit stage', {
          chainId,
          address: addr,
          logoURL: finalURL,
        });
      }
    } catch (e) {
      committedAsset = {
        ...(committedAsset as TokenContract),
        logoURL: defaultMissingImage,
      };
      if (DEBUG_ENABLED) {
        debug.warn('⚠️ getLogoURL failed at commit stage; using fallback', {
          chainId,
          address: addr,
          error: e,
        });
      }
    }
  }

  if (DEBUG_ENABLED) {
    const addr = (committedAsset as any)?.address ?? '—';
    const sym = (committedAsset as any)?.symbol ?? '—';
    const nm = (committedAsset as any)?.name ?? '—';
    const logo = (committedAsset as any)?.logoURL ?? '—';
    console.log(
      `🏁 finalState → ${InputState[finalState]} | asset: { address: ${addr}, symbol: ${sym}, name: ${nm}, logoURL: ${logo} }`
    );
  }

  // Surface asset only for preview/commit states
  const isCommit =
    finalState === InputState.UPDATE_VALIDATED_ASSET ||
    finalState === InputState.CLOSE_SELECT_PANEL;
  const isPreview = finalState === InputState.VALIDATE_PREVIEW;

  return hasAddr && (isPreview || isCommit)
    ? { finalState, asset: committedAsset }
    : { finalState };
}
