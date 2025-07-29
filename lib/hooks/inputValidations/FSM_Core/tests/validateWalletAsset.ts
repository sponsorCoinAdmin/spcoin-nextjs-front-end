// File: lib/hooks/inputValidations//FSM_Core/tests/validateWalletAsset.ts

import { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';
import { InputState } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

const LOG_TIME:boolean = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_FSM_CORE === 'true';
const debugLog = createDebugLogger('validateWalletAsset', DEBUG_ENABLED, LOG_TIME);

export async function validateWalletAsset(input: ValidateFSMInput): Promise<ValidateFSMOutput> {
  const { validatedWallet } = input;

alert(`Running validateWalletAsset → ${stringifyBigInt({ validatedWallet })}`);
  debugLog.log(`Running validateWalletAsset → ${stringifyBigInt({ validatedWallet })}`);
  if (!validatedWallet || typeof validatedWallet !== 'object') {
    return {
      nextState: InputState.RESOLVE_ASSET_ERROR,
      errorMessage: 'Validated asset is undefined or invalid type',
    };
  }

  // Type narrowing
  const wallet = validatedWallet as any;

  if (!wallet.name || typeof wallet.name !== 'string') {
    return error('Missing or invalid name');
  }

  if (!wallet.symbol || typeof wallet.symbol !== 'string') {
    return error('Missing or invalid symbol');
  }

  if (!wallet.type || typeof wallet.type !== 'string') {
    return error('Missing or invalid type');
  }

  if (!wallet.website || typeof wallet.website !== 'string') {
    return error('Missing or invalid website');
  }

  if (!wallet.description || typeof wallet.description !== 'string') {
    return error('Missing or invalid description');
  }

  if (!wallet.status || typeof wallet.status !== 'string') {
    return error('Missing or invalid status');
  }

  if (!wallet.address || typeof wallet.address !== 'string') {
    return error('Missing or invalid address');
  }

  if (wallet.balance === undefined || typeof wallet.balance !== 'bigint') {
    return error('Missing or invalid balance');
  }

  debugLog.log(`✅ WalletAccount validated: ${wallet.name} (${wallet.address})`);

  return {
    nextState: InputState.UPDATE_VALIDATED_ASSET,
    validatedWallet: wallet,
  };
}

function error(msg: string): ValidateFSMOutput {
  debugLog.error(`❌ ${msg}`);
  return {
    nextState: InputState.RESOLVE_ASSET_ERROR,
    errorMessage: msg,
  };
}
