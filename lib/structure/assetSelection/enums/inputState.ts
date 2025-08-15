// File: lib/structure/assetSelection/enums/inputState.ts

// ---------------------------------------------------------------------------
// InputState (renumbered consecutively from 0; preview only after resolve)
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
  PREVIEW_CONTRACT_EXISTS_LOCALLY = 7,

  // 4️⃣ Blockchain existence check
  VALIDATE_EXISTS_ON_CHAIN = 8,
  CONTRACT_NOT_FOUND_ON_BLOCKCHAIN = 9,

  // 5️⃣ Asset check (balance, metadata)
  RESOLVE_ASSET = 10,

  // 6️⃣ Error outcomes from resolve
  TOKEN_NOT_RESOLVED_ERROR = 11,
  RESOLVE_ASSET_ERROR = 12,
  MISSING_ACCOUNT_ADDRESS = 13,

  // 7️⃣ Preview Asset (only after RESOLVE_ASSET when manualEntry === true)
  VALIDATE_PREVIEW = 14,

  // 8️⃣ Final delivery
  UPDATE_VALIDATED_ASSET = 15,

  // 9️⃣ Final close
  CLOSE_SELECT_PANEL = 16,
}
