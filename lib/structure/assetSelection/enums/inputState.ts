// File: lib/structure/assetSelection/enums/inputState.ts

// ---------------------------------------------------------------------------
/** InputState (renumbered consecutively from 0; preview only after resolve) */
// ---------------------------------------------------------------------------

export enum InputState {
  // 0️⃣ Blank input
  EMPTY_INPUT = 0,

  // 1️⃣ Hex input validation
  INVALID_HEX_INPUT = 1,
  VALIDATE_ADDRESS = 2,
  INCOMPLETE_ADDRESS = 3,
  INVALID_ADDRESS_INPUT = 4,

  // 2️⃣ Duplication check
  TEST_DUPLICATE_INPUT = 5,
  DUPLICATE_INPUT_ERROR = 6,

  // 3️⃣ Preview check phase (local summaries/cache lookups)
  PREVIEW_ADDRESS = 7,
  PREVIEW_CONTRACT_EXISTS_LOCALLY = 8,

  // 4️⃣ Blockchain existence check
  VALIDATE_EXISTS_ON_CHAIN = 10,
  CONTRACT_NOT_FOUND_ON_BLOCKCHAIN = 11,

  // 5️⃣ Asset check (balance, metadata)
  RESOLVE_ASSET = 12,

  // 6️⃣ Error outcomes from resolve
  TOKEN_NOT_RESOLVED_ERROR = 13,
  RESOLVE_ASSET_ERROR = 14,
  MISSING_ACCOUNT_ADDRESS = 15,

  // 7️⃣ Preview Asset (shown only after RESOLVE_ASSET when manualEntry === true)
  VALIDATE_PREVIEW = 16,

  // 8️⃣ Final delivery
  UPDATE_VALIDATED_ASSET = 17,

  // 9️⃣ Final close
  CLOSE_SELECT_PANEL = 18,
}
