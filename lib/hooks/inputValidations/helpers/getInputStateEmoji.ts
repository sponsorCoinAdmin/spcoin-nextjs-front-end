// File: lib/hooks/inputValidations/helpers/getInputStateEmoji.ts

import { InputState } from '@/lib/structure';

export function getInputStateEmoji(state: InputState): string {
  switch (state) {
    case InputState.EMPTY_INPUT:
      return '🈳'; // empty square
    case InputState.INVALID_HEX_INPUT:
      return '⚠️'; // warning
    case InputState.VALIDATE_ADDRESS:
      return '📬'; // inbox with mail
    case InputState.INCOMPLETE_ADDRESS:
      return '✏️'; // pencil/edit
    case InputState.INVALID_ADDRESS_INPUT:
      return '⛔'; // no entry
    case InputState.TEST_DUPLICATE_INPUT:
      return '🧪'; // lab test
    case InputState.DUPLICATE_INPUT_ERROR:
      return '♻️'; // repeat/duplicate
    case InputState.VALIDATE_EXISTS_ON_CHAIN:
      return '🔗'; // link/chain
    case InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN:
      return '🚫'; // prohibited
    case InputState.VALIDATE_PREVIEW:
      return '🔍'; // magnifying glass
    case InputState.PREVIEW_ADDRESS:
      return '🖼️'; // picture/frame
    case InputState.PREVIEW_CONTRACT_EXISTS_LOCALLY:
      return '💾'; // save disk
    case InputState.RESOLVE_ASSET:
      return '💰'; // money bag
    case InputState.RESOLVE_ASSET_ERROR:
      return '❌'; // red cross
    case InputState.TOKEN_NOT_RESOLVED_ERROR:
      return '❌'; // red cross
    case InputState.UPDATE_VALIDATED_ASSET:
      return '🔄'; // update
    case InputState.CLOSE_SELECT_PANEL:
      return '✅'; // checkmark
    default:
      return '❓'; // unknown
  }
}
