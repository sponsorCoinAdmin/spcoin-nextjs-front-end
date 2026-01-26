// File: @/lib/hooks/inputValidations/FSM_Core/studyPolicy.ts
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';

/**
 * Study policy: enable/disable individual validation “studies” per panel.
 * Each study SHOULD call `isStudyEnabled(container, StudyId.XXX)` and early-return
 * to the appropriate NEXT state when disabled.
 */

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_FSM === 'true';
const debugLog = createDebugLogger('studyPolicy', DEBUG_ENABLED, LOG_TIME);

/** Keep study identifiers centralized to avoid stringly-typed usage. */
export enum StudyId {
  VALIDATE_ADDRESS = 'VALIDATE_ADDRESS',
  TEST_DUPLICATE_INPUT = 'TEST_DUPLICATE_INPUT',
  VALIDATE_PREVIEW = 'VALIDATE_PREVIEW',
  PREVIEW_CONTRACT_EXISTS_LOCALLY = 'PREVIEW_CONTRACT_EXISTS_LOCALLY',
  VALIDATE_EXISTS_ON_CHAIN = 'VALIDATE_EXISTS_ON_CHAIN',
  RESOLVE_ERC20_ASSET = 'RESOLVE_ERC20_ASSET',
  RETURN_VALIDATED_ASSET = 'RETURN_VALIDATED_ASSET',
}

/** A single panel’s row in the policy matrix. */
type PanelPolicy = Readonly<Partial<Record<StudyId, boolean>>>;

/**
 * Default policy matrix.
 * true  → study runs
 * false → study is bypassed (study function should early-return as if passed)
 *
 * NOTE:
 * - This is intentionally a Partial over SP_COIN_DISPLAY so you only need to
 *   specify panels you care about. Any missing entry defaults to `false`.
 * - You can override any cell at runtime via env:
 *   NEXT_PUBLIC_FSM_{PANEL_ENUM_NAME}_{STUDY_ID}_ENABLED = 'true' | 'false'
 *   e.g. NEXT_PUBLIC_FSM_AGENT_LIST_SELECT_PANEL_VALIDATE_EXISTS_ON_CHAIN_ENABLED=false
 */
const DEFAULT_POLICY: Partial<Record<SP_COIN_DISPLAY, PanelPolicy>> = {
  // Trading station doesn’t run the selection FSM (keep all off)
  [SP_COIN_DISPLAY.TRADING_STATION_PANEL]: {
    [StudyId.RETURN_VALIDATED_ASSET]: false,
  },

  // BUY token list (full token pipeline)
  [SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL]: {
    [StudyId.VALIDATE_ADDRESS]: true,
    [StudyId.TEST_DUPLICATE_INPUT]: true,
    [StudyId.VALIDATE_PREVIEW]: true,
    [StudyId.PREVIEW_CONTRACT_EXISTS_LOCALLY]: true,
    [StudyId.VALIDATE_EXISTS_ON_CHAIN]: true,
    [StudyId.RESOLVE_ERC20_ASSET]: true,
    [StudyId.RETURN_VALIDATED_ASSET]: true,
  },

  // SELL token list (full token pipeline)
  [SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL]: {
    [StudyId.VALIDATE_ADDRESS]: true,
    [StudyId.TEST_DUPLICATE_INPUT]: true,
    [StudyId.VALIDATE_PREVIEW]: true,
    [StudyId.PREVIEW_CONTRACT_EXISTS_LOCALLY]: true,
    [StudyId.VALIDATE_EXISTS_ON_CHAIN]: true,
    [StudyId.RESOLVE_ERC20_ASSET]: true,
    [StudyId.RETURN_VALIDATED_ASSET]: true,
  },

  // RECIPIENT selection (spCoinAccount-like → bypass token-only checks)
  [SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL_OLD]: {
    [StudyId.VALIDATE_ADDRESS]: true,
    [StudyId.TEST_DUPLICATE_INPUT]: true,
    [StudyId.VALIDATE_PREVIEW]: true,
    [StudyId.PREVIEW_CONTRACT_EXISTS_LOCALLY]: false,
    [StudyId.VALIDATE_EXISTS_ON_CHAIN]: false,
    [StudyId.RESOLVE_ERC20_ASSET]: true,
    [StudyId.RETURN_VALIDATED_ASSET]: true,
  },

  // AGENT selection (spCoinAccount-like → bypass token-only checks)
  [SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL_OLD]: {
    [StudyId.VALIDATE_ADDRESS]: true,
    [StudyId.TEST_DUPLICATE_INPUT]: true,
    [StudyId.VALIDATE_PREVIEW]: true,
    [StudyId.PREVIEW_CONTRACT_EXISTS_LOCALLY]: false,
    [StudyId.VALIDATE_EXISTS_ON_CHAIN]: false,
    [StudyId.RESOLVE_ERC20_ASSET]: true,
    [StudyId.RETURN_VALIDATED_ASSET]: true,
  },

  // SPONSOR selection (spCoinAccount-like → bypass token-only checks)
  [SP_COIN_DISPLAY.TOKEN_CONTRACT_PANEL]: {
    [StudyId.VALIDATE_ADDRESS]: true,
    [StudyId.TEST_DUPLICATE_INPUT]: true,
    [StudyId.VALIDATE_PREVIEW]: true,
    [StudyId.PREVIEW_CONTRACT_EXISTS_LOCALLY]: false,
    [StudyId.VALIDATE_EXISTS_ON_CHAIN]: false,
    [StudyId.RESOLVE_ERC20_ASSET]: true,
    [StudyId.RETURN_VALIDATED_ASSET]: true,
  },

  // Error and undefined panels don’t run the FSM
  [SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL]: {},
  [SP_COIN_DISPLAY.UNDEFINED]: {},
};

/** Resolve a single env override flag for (panel, study). */
function envOverride(panel: SP_COIN_DISPLAY, study: StudyId, current: boolean | undefined) {
  // Key shape: NEXT_PUBLIC_FSM_{PANEL_ENUM_NAME}_{STUDY_ID}_ENABLED
  // Example: NEXT_PUBLIC_FSM_RECIPIENT_LIST_SELECT_PANEL_VALIDATE_EXISTS_ON_CHAIN_ENABLED=false
  const panelName = SP_COIN_DISPLAY[panel]; // enum → name
  const key = `NEXT_PUBLIC_FSM_${panelName}_${study}_ENABLED`;
  const raw = process.env[key as keyof NodeJS.ProcessEnv];

  if (raw === 'true') return true;
  if (raw === 'false') return false;

  return current ?? false; // default when not specified
}

/** Helper to read the panel row (may be undefined for panels not listed). */
function getPanelPolicy(panel: SP_COIN_DISPLAY): PanelPolicy | undefined {
  return DEFAULT_POLICY[panel];
}

/**
 * Public gate: a study should call this before doing work.
 * Returns final ON/OFF after applying env overrides.
 */
export function isStudyEnabled(panel: SP_COIN_DISPLAY, study: StudyId): boolean {
  const base = getPanelPolicy(panel)?.[study];
  const enabled = envOverride(panel, study, base);

  if (DEBUG_ENABLED) {
    debugLog.log(
      `policy → panel=${SP_COIN_DISPLAY[panel]} study=${study} base=${String(
        base
      )} → enabled=${enabled}`
    );
  }
  return !!enabled;
}
