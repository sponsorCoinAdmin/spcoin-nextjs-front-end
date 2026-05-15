export function toPendingRewardsBigInt(value: unknown): bigint {
  const normalized = String(value ?? '0').replace(/,/g, '').trim();
  if (!normalized) return 0n;
  try {
    return BigInt(normalized);
  } catch {
    return 0n;
  }
}

export function calculateFormattedDT(secondsValue: unknown): string {
  const seconds = Number(toPendingRewardsBigInt(secondsValue));
  if (!Number.isFinite(seconds) || seconds <= 0) return 'N/A';
  const date = new Date(seconds * 1000);
  if (Number.isNaN(date.getTime())) return 'N/A';
  const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  const hour24 = date.getHours();
  const hour12 = hour24 % 12 || 12;
  const minute = String(date.getMinutes()).padStart(2, '0');
  const meridiem = hour24 < 12 ? 'a.m.' : 'p.m.';
  const timeZone =
    date
      .toLocaleTimeString('en-US', { timeZoneName: 'short' })
      .split(' ')
      .pop() || '';
  return `${month}-${day}-${year}, ${hour12}:${minute} ${meridiem}${timeZone ? ` ${timeZone}` : ''}`;
}

export const formatPendingRewardsTimestamp = calculateFormattedDT;

function getPendingRewardsRole(record: Record<string, unknown>): 'Sponsor' | 'Recipient' | 'Agent' {
  const type = String(record.TYPE ?? '').toUpperCase();
  if (type.includes('SPONSOR')) return 'Sponsor';
  if (type.includes('RECIPIENT')) return 'Recipient';
  if (type.includes('AGENT')) return 'Agent';
  if (toPendingRewardsBigInt(record.pendingSponsorRewards) > 0n) return 'Sponsor';
  if (toPendingRewardsBigInt(record.pendingRecipientRewards) > 0n) return 'Recipient';
  if (toPendingRewardsBigInt(record.pendingAgentRewards) > 0n) return 'Agent';
  if (toPendingRewardsBigInt(record.lastSponsorUpdate) > 0n || toPendingRewardsBigInt(record.lastSponsorUpdateTimeStamp) > 0n) return 'Sponsor';
  if (toPendingRewardsBigInt(record.lastRecipientUpdate) > 0n || toPendingRewardsBigInt(record.lastRecipientUpdateTimeStamp) > 0n) return 'Recipient';
  return 'Agent';
}

function getRoleTimestamp(record: Record<string, unknown>, role: 'Sponsor' | 'Recipient' | 'Agent'): string {
  return toPendingRewardsBigInt(
    record[`last${role}TimeStamp`] ??
      record[`last${role}UpdateTimeStamp`] ??
      record[`last${role}Update`],
  ).toString();
}

function isScalarRewardValue(value: unknown): boolean {
  return value == null || ['string', 'number', 'bigint', 'boolean'].includes(typeof value);
}

function formatDurationParts(milliseconds: bigint): string {
  let remaining = milliseconds < 0n ? -milliseconds : milliseconds;
  const msPerSecond = 1000n;
  const msPerMinute = 60n * msPerSecond;
  const msPerDay = 24n * 60n * msPerMinute;
  const msPerYear = 365n * msPerDay;
  const years = remaining / msPerYear;
  remaining %= msPerYear;
  const days = remaining / msPerDay;
  remaining %= msPerDay;
  const mins = remaining / msPerMinute;
  remaining %= msPerMinute;
  const seconds = remaining / msPerSecond;
  const ms = remaining % msPerSecond;
  const parts: string[] = [];
  if (years > 1n) parts.push(`Years: ${years.toString()}`);
  if (days > 1n) parts.push(`Days: ${days.toString()}`);
  if (mins > 1n) parts.push(`Minutes: ${mins.toString()}`);
  if (seconds > 1n) parts.push(`Seconds: ${seconds.toString()}`);
  if (ms > 1n) parts.push(`Milli: ${ms.toString()}`);
  return parts.join(', ') || '0';
}

export function hasPendingRewardsFields(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (record.TYPE === '--PENDING_REWARDS--') return false;
  return (
    (Object.prototype.hasOwnProperty.call(record, 'pendingRewards') && isScalarRewardValue(record.pendingRewards)) ||
    (Object.prototype.hasOwnProperty.call(record, 'pendingTotalRewards') && isScalarRewardValue(record.pendingTotalRewards)) ||
    (Object.prototype.hasOwnProperty.call(record, 'totalRewards') && isScalarRewardValue(record.totalRewards)) ||
    Object.prototype.hasOwnProperty.call(record, 'pendingSponsorRewards') ||
    Object.prototype.hasOwnProperty.call(record, 'pendingRecipientRewards') ||
    Object.prototype.hasOwnProperty.call(record, 'pendingAgentRewards')
  );
}

export function normalizePendingRewardsDisplayResult(value: unknown): unknown {
  if (!hasPendingRewardsFields(value)) return value;
  const record = value;
  const isClaimSummary =
    Object.prototype.hasOwnProperty.call(record, 'totalRewardsClaimed') ||
    Object.prototype.hasOwnProperty.call(record, 'sponsorRewardsClaimed') ||
    Object.prototype.hasOwnProperty.call(record, 'recipientRewardsClaimed') ||
    Object.prototype.hasOwnProperty.call(record, 'agentRewardsClaimed') ||
    Object.prototype.hasOwnProperty.call(record, 'receipts') ||
    Object.prototype.hasOwnProperty.call(record, 'refreshedRewards');
  const pendingSponsorRewards = toPendingRewardsBigInt(record.pendingSponsorRewards).toString();
  const pendingRecipientRewards = toPendingRewardsBigInt(record.pendingRecipientRewards).toString();
  const pendingAgentRewards = toPendingRewardsBigInt(record.pendingAgentRewards).toString();
  const componentTotal =
    toPendingRewardsBigInt(pendingSponsorRewards) +
    toPendingRewardsBigInt(pendingRecipientRewards) +
    toPendingRewardsBigInt(pendingAgentRewards);
  const explicitTotal = toPendingRewardsBigInt(record.pendingRewards ?? record.pendingTotalRewards ?? record.totalRewards);
  const pendingRewards =
    explicitTotal > 0n || componentTotal === 0n
      ? explicitTotal.toString()
      : componentTotal.toString();
  const calculatedTimeStamp = String(record.calculatedTimeStamp ?? record.calculatedmestamp ?? record.calculatedAtTimestamp ?? '0');
  const role = getPendingRewardsRole(record);
  const lastRoleTimeStampKey = `last${role}TimeStamp`;
  const lastRoleUpdateKey = `last${role}Update`;
  const lastRoleTimeStamp = getRoleTimestamp(record, role);
  const timeDifferenceMS = (
    toPendingRewardsBigInt(calculatedTimeStamp) - toPendingRewardsBigInt(lastRoleTimeStamp)
  ).toString();
  const formattedDifference = formatDurationParts(toPendingRewardsBigInt(timeDifferenceMS) * 1000n);
  const calculatedFormatted =
    String(record.calculatedFormatted ?? record.calculatedAt ?? '').trim() ||
    calculateFormattedDT(calculatedTimeStamp);
  const {
    calculatedAt,
    calculatedAtTimestamp,
    calculatedmestamp,
    calculatedTimeStamp: _calculatedTimeStamp,
    calculatedFormatted: _calculatedFormatted,
    pendingRewards: _pendingRewards,
    pendingTotalRewards: _pendingTotalRewards,
    totalRewards: _totalRewards,
    pendingSponsorRewards: _pendingSponsorRewards,
    pendingRecipientRewards: _pendingRecipientRewards,
    pendingAgentRewards: _pendingAgentRewards,
    totalRewardsClaimed,
    sponsorRewardsClaimed,
    recipientRewardsClaimed,
    agentRewardsClaimed,
    receipts,
    refreshedRewards,
    lastSponsorUpdate,
    lastRecipientUpdate,
    lastAgentUpdate,
    lastSponsorTimeStamp,
    lastRecipientTimeStamp,
    lastAgentTimeStamp,
    lastSponsorUpdateTimeStamp,
    lastRecipientUpdateTimeStamp,
    lastAgentUpdateTimeStamp,
    ...restRecord
  } = record;
  void calculatedAt;
  void calculatedAtTimestamp;
  void calculatedmestamp;
  void _calculatedTimeStamp;
  void _calculatedFormatted;
  void _pendingRewards;
  void _pendingTotalRewards;
  void _totalRewards;
  void _pendingSponsorRewards;
  void _pendingRecipientRewards;
  void _pendingAgentRewards;
  void totalRewardsClaimed;
  void sponsorRewardsClaimed;
  void recipientRewardsClaimed;
  void agentRewardsClaimed;
  void receipts;
  void refreshedRewards;
  void lastSponsorUpdate;
  void lastRecipientUpdate;
  void lastAgentUpdate;
  void lastSponsorTimeStamp;
  void lastRecipientTimeStamp;
  void lastAgentTimeStamp;
  void lastSponsorUpdateTimeStamp;
  void lastRecipientUpdateTimeStamp;
  void lastAgentUpdateTimeStamp;
  if (isClaimSummary) {
    return {
      ...restRecord,
      TYPE: restRecord.TYPE ?? '--ACCOUNT_PENDING_REWARDS--',
      accountKey: String(restRecord.accountKey ?? ''),
      [lastRoleUpdateKey]: calculateFormattedDT(lastRoleTimeStamp),
      calculatedFormatted,
      formattedDifference,
      ...(pendingSponsorRewards !== '0' ? { pendingSponsorRewards } : {}),
      ...(pendingRecipientRewards !== '0' ? { pendingRecipientRewards } : {}),
      ...(pendingAgentRewards !== '0' ? { pendingAgentRewards } : {}),
      pendingTotalRewards: pendingRewards,
      __showEmptyFields: true,
    };
  }

  return {
    ...restRecord,
    TYPE: restRecord.TYPE ?? '--ACCOUNT_PENDING_REWARDS--',
    accountKey: String(restRecord.accountKey ?? ''),
    calculatedTimeStamp,
    [lastRoleTimeStampKey]: lastRoleTimeStamp,
    timeDifferenceMS,
    calculatedFormatted,
    [lastRoleUpdateKey]: calculateFormattedDT(lastRoleTimeStamp),
    formattedDifference,
    pendingRewards,
    pendingSponsorRewards,
    pendingRecipientRewards,
    pendingAgentRewards,
    pendingTotalRewards: pendingRewards,
    totalRewards: pendingRewards,
    __showEmptyFields: true,
  };
}
