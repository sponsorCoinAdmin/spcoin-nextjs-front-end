// File: lib/hooks/inputValidations/helpers/debugLogInstance.ts

import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_VALIDATION_STATE === 'true';

export const debugLog = createDebugLogger('useInputValidationState', DEBUG_ENABLED, LOG_TIME);
