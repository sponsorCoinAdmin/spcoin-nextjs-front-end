// File: lib/hooks/inputValidations/validations/isEmptyInput.ts

import { getValidationDebugLogger } from '../helpers/debugLogInstance';

const log = getValidationDebugLogger('isEmptyInput');

export function isEmptyInput(input: string | undefined): boolean {
  log.log(`🔍 ENTRY → isEmptyInput called with input: "${input}"`);

  const trimmed = input?.trim() ?? '';
  const isEmpty = trimmed === '';

  if (isEmpty) {
    log.log('⛔ Detected empty input (undefined or blank)');
  }

  log.log(`✅ EXIT → isEmptyInput result: ${isEmpty}`);

  return isEmpty;
}
