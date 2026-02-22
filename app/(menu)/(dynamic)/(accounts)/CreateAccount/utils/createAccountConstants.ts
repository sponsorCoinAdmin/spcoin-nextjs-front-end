import type { AccountFormData, AccountFormField } from '../types';

export const DEFAULT_ACCOUNT_LOGO_URL = '/assets/miscellaneous/Anonymous.png';
export const LOGO_TARGET_WIDTH_PX = 400;
export const LOGO_TARGET_HEIGHT_PX = 400;
export const LOGO_MAX_OUTPUT_BYTES = 500 * 1024;
export const LOGO_MAX_INPUT_BYTES = 25 * 1024 * 1024;

export const EMPTY_FORM_DATA: AccountFormData = {
  name: '',
  symbol: '',
  email: '',
  website: '',
  description: '',
};

export const FORM_FIELDS: AccountFormField[] = [
  'name',
  'symbol',
  'email',
  'website',
  'description',
];

export const FORM_ERROR_FOCUS_ORDER: AccountFormField[] = [
  'name',
  'symbol',
  'email',
  'website',
  'description',
];

export const FIELD_MAX_LENGTHS: Partial<Record<AccountFormField, number>> = {
  name: 50,
  symbol: 10,
  email: 256,
  website: 256,
  description: 1024,
};

export const FIELD_TITLES = {
  publicKey: 'Required Account on a connected Metamask Account.',
  name: 'Account Name, Do Not use a personal name',
  symbol: 'Account Symbol',
  email: 'Account Email',
  website: 'Accounts Website',
  description: 'Account Description',
} as const;

export const FIELD_PLACEHOLDERS = {
  publicKey: 'Required Account on a connected Metamask Account.',
  name: 'Account Name Title, Example: "Save the World"',
  symbol: 'Account Symbol, For Example "WORLD"',
  email: 'Account Email, do not use a personal Email',
  website: 'Accounts Website URL',
  description: 'Account Description',
} as const;
