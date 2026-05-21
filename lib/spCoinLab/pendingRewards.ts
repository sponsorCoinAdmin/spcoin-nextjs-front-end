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

function getVisiblePendingRewardComponents(
  role: 'Sponsor' | 'Recipient' | 'Agent',
  pendingSponsorRewards: string,
  pendingRecipientRewards: string,
  pendingAgentRewards: string,
): Record<string, string> {
  if (role === 'Sponsor') return { pendingSponsorRewards };
  if (role === 'Recipient') return { pendingRecipientRewards };
  return { pendingAgentRewards };
}

function isScalarRewardValue(value: unknown): boolean {
  return value == null || ['string', 'number', 'bigint', 'boolean'].includes(typeof value);
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
  const hasAnyPendingRewardComponent =
    Object.prototype.hasOwnProperty.call(record, 'pendingSponsorRewards') ||
    Object.prototype.hasOwnProperty.call(record, 'pendingRecipientRewards') ||
    Object.prototype.hasOwnProperty.call(record, 'pendingAgentRewards');
  const componentTotal =
    toPendingRewardsBigInt(pendingSponsorRewards) +
    toPendingRewardsBigInt(pendingRecipientRewards) +
    toPendingRewardsBigInt(pendingAgentRewards);
  const explicitTotal = toPendingRewardsBigInt(record.pendingRewards ?? record.pendingTotalRewards ?? record.totalRewards);
  const pendingRewards =
    hasAnyPendingRewardComponent
      ? componentTotal.toString()
      : explicitTotal.toString();
  const calculatedTimeStamp = String(record.calculatedTimeStamp ?? record.calculatedmestamp ?? record.calculatedAtTimestamp ?? '0');
  const role = getPendingRewardsRole(record);
  const visiblePendingRewardComponents = getVisiblePendingRewardComponents(
    role,
    pendingSponsorRewards,
    pendingRecipientRewards,
    pendingAgentRewards,
  );
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
      calculatedFormatted,
      ...visiblePendingRewardComponents,
      pendingTotalRewards: pendingRewards,
      __showEmptyFields: true,
    };
  }

  return {
    ...restRecord,
    TYPE: restRecord.TYPE ?? '--ACCOUNT_PENDING_REWARDS--',
    accountKey: String(restRecord.accountKey ?? ''),
    calculatedTimeStamp,
    calculatedFormatted,
    ...visiblePendingRewardComponents,
    pendingTotalRewards: pendingRewards,
    __showEmptyFields: true,
  };
}
