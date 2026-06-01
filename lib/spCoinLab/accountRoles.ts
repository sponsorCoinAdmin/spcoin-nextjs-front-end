export type SpCoinAccountRole = 'Sponsor' | 'Recipient' | 'Agent';
export type SpCoinAccountRolesMask = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const SPCOIN_ROLE_NA = 0;
export const SPCOIN_ROLE_SPONSOR = 1;
export const SPCOIN_ROLE_RECIPIENT = 2;
export const SPCOIN_ROLE_AGENT = 4;

export type SpCoinAccountRoleCounts = {
  sponsorCount?: unknown;
  recipientCount?: unknown;
  agentCount?: unknown;
  parentRecipientCount?: unknown;
  isSponsor?: unknown;
  isRecipient?: unknown;
  isRecipiet?: unknown;
  isAgent?: unknown;
};

function toBooleanRoleFlag(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  const normalized = String(value ?? '').trim().toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'no'].includes(normalized)) return false;
  return undefined;
}

function hasRoleShape(value: Record<string, unknown>): boolean {
  return (
    Object.prototype.hasOwnProperty.call(value, 'roles') ||
    Object.prototype.hasOwnProperty.call(value, 'isSponsor') ||
    Object.prototype.hasOwnProperty.call(value, 'isRecipient') ||
    Object.prototype.hasOwnProperty.call(value, 'isRecipiet') ||
    Object.prototype.hasOwnProperty.call(value, 'isAgent')
  );
}

function toRolesMask(value: unknown): SpCoinAccountRolesMask | null {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 7) {
    return value as SpCoinAccountRolesMask;
  }
  const normalized = String(value ?? '').trim();
  if (/^[0-7]$/.test(normalized)) return Number(normalized) as SpCoinAccountRolesMask;
  return null;
}

export function resolveSpCoinAccountRoles(account: unknown): SpCoinAccountRole[] {
  if (!account || typeof account !== 'object' || Array.isArray(account)) return [];
  const record = account as Record<string, unknown>;
  if (!hasRoleShape(record)) return [];

  if (Array.isArray(record.roles)) {
    return [
      record.roles.some((role) => String(role).toLowerCase() === 'sponsor') ? 'Sponsor' : '',
      record.roles.some((role) => String(role).toLowerCase() === 'recipient') ? 'Recipient' : '',
      record.roles.some((role) => String(role).toLowerCase() === 'agent') ? 'Agent' : '',
    ].filter(Boolean) as SpCoinAccountRole[];
  }

  const rolesMask = toRolesMask(record.roles);
  const isSponsor =
    rolesMask !== null
      ? (rolesMask & SPCOIN_ROLE_SPONSOR) === SPCOIN_ROLE_SPONSOR
      : toBooleanRoleFlag(record.isSponsor) === true;
  const isRecipient =
    rolesMask !== null
      ? (rolesMask & SPCOIN_ROLE_RECIPIENT) === SPCOIN_ROLE_RECIPIENT
      : toBooleanRoleFlag(record.isRecipient ?? record.isRecipiet) === true;
  const isAgent =
    rolesMask !== null
      ? (rolesMask & SPCOIN_ROLE_AGENT) === SPCOIN_ROLE_AGENT
      : toBooleanRoleFlag(record.isAgent) === true;
  return [
    isSponsor ? 'Sponsor' : '',
    isRecipient ? 'Recipient' : '',
    isAgent ? 'Agent' : '',
  ].filter(Boolean) as SpCoinAccountRole[];
}

export function resolveSpCoinAccountRoleLabel(account: unknown): string {
  return resolveSpCoinAccountRoles(account).join(' / ');
}

export function resolveSpCoinMethodRole(method: unknown): SpCoinAccountRole | '' {
  const methodName = String(method ?? '').trim();
  if (/SponsorRewards$/i.test(methodName)) return 'Sponsor';
  if (/RecipientRewards$/i.test(methodName)) return 'Recipient';
  if (/AgentRewards$/i.test(methodName)) return 'Agent';
  return '';
}
