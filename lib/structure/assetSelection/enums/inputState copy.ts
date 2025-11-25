// File: @/lib/structure/assetSelection/enums/inputState.ts

// ---------------------------------------------------------------------------
// InputState (renumbered consecutively from 0; preview only after resolve)
// ---------------------------------------------------------------------------

export enum InputState {
  // 0️⃣ Blank input
  EMPTY_INPUT = 0,

  // 1️⃣ Hex input validation
  INVALID_HEX_INPUT,
  VALIDATE_ADDRESS,
  INCOMPLETE_ADDRESS,
  INVALID_ADDRESS_INPUT,

  // 2️⃣ Duplication check
  TEST_DUPLICATE_INPUT,
  DUPLICATE_INPUT_ERROR,

  // 3️⃣ Preview check phase (local summaries/cache lookups)
  PREVIEW_CONTRACT_NOT_FOUND_LOCALLY,

  // 4️⃣ Blockchain existence check
  VALIDATE_EXISTS_ON_CHAIN,
  CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,

  // 5️⃣ Asset check (balance, metadata)
  RESOLVE_ERC20_ASSET,

  // 6️⃣ Error outcomes from resolve
  VALIDATE_ERC20_ASSET_ERROR,
  VALIDATE_ERC20_ASSET_ERROR,
  MISSING_ACCOUNT_ADDRESS,

  // 7️⃣ Preview Asset (only after RESOLVE_ERC20_ASSET when manualEntry === true)
  VALIDATE_PREVIEW,

  // 8️⃣ Final delivery
  UPDATE_VALIDATED_ASSET,

  // 9️⃣ Final close
  CLOSE_SELECT_PANEL,
}
