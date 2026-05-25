export type SpCoinAccountRole = 'Sponsor' | 'Recipient' | 'Agent';

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
    Object.prototype.hasOwnProperty.call(value, 'isSponsor') ||
    Object.prototype.hasOwnProperty.call(value, 'isRecipient') ||
    Object.prototype.hasOwnProperty.call(value, 'isRecipiet') ||
    Object.prototype.hasOwnProperty.call(value, 'isAgent')
  );
}

export function resolveSpCoinAccountRoles(account: unknown): SpCoinAccountRole[] {
  if (!account || typeof account !== 'object' || Array.isArray(account)) return [];
  const record = account as Record<string, unknown>;
  if (!hasRoleShape(record)) return [];

  const isSponsor = toBooleanRoleFlag(record.isSponsor) === true;
  const isRecipient = toBooleanRoleFlag(record.isRecipient ?? record.isRecipiet) === true;
  const isAgent = toBooleanRoleFlag(record.isAgent) === true;
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
