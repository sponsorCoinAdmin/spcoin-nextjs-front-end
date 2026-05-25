export function toPendingRewardsBigInt(value: unknown): bigint {
  const normalized = String(value ?? '0').replace(/,/g, '').trim().match(/^-?\d+/)?.[0] ?? '';
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

function formatSecondsValue(value: unknown): string {
  return `${toPendingRewardsBigInt(value).toLocaleString('en-US')} Seconds`;
}

function formatTokenQuantityValue(value: unknown, decimals = 18): string {
  const raw = toPendingRewardsBigInt(value);
  const scale = 10n ** BigInt(decimals);
  const whole = raw / scale;
  const fractional = raw % scale;
  if (fractional === 0n) return whole.toLocaleString('en-US');
  const fractionalText = fractional.toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${whole.toLocaleString('en-US')}.${fractionalText}`;
}

function calculateTimestampDifference(startValue: unknown, endValue: unknown): string {
  const start = toPendingRewardsBigInt(startValue);
  const end = toPendingRewardsBigInt(endValue);
  if (start <= 0n || end <= start) return '0';
  return (end - start).toString();
}

function formatTimestampDifference(secondsValue: unknown): string {
  let remaining = toPendingRewardsBigInt(secondsValue);
  if (remaining <= 0n) return 'Years: 0, Days: 0, Hours: 0, Mins: 0, Secs: 0';

  const yearSeconds = 31556925n;
  const daySeconds = 24n * 60n * 60n;
  const hourSeconds = 60n * 60n;
  const minuteSeconds = 60n;

  const years = remaining / yearSeconds;
  remaining %= yearSeconds;
  const days = remaining / daySeconds;
  remaining %= daySeconds;
  const hours = remaining / hourSeconds;
  remaining %= hourSeconds;
  const mins = remaining / minuteSeconds;
  const secs = remaining % minuteSeconds;

  const parts = [
    years > 0n ? `Years: ${years.toString()}` : '',
    days > 0n ? `Days: ${days.toString()}` : '',
    hours > 0n ? `Hours: ${hours.toString()}` : '',
    mins > 0n ? `Mins: ${mins.toString()}` : '',
    secs > 0n ? `Secs: ${secs.toString()}` : '',
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Secs: 0';
}

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

function getRoleLastUpdateValue(record: Record<string, unknown>, role: 'Sponsor' | 'Recipient' | 'Agent') {
  if (record.lastUpDateTimeStamp !== undefined) return record.lastUpDateTimeStamp;
  if (role === 'Sponsor') {
    return record.sponsorBucketLastUpdateTimeStamp ?? record.lastSponsorUpdate ?? record.lastSponsorUpdateTimeStamp ?? record.lastSponsorTimeStamp ?? '0';
  }
  if (role === 'Recipient') {
    return record.recipientBucketLastUpdateTimeStamp ?? record.lastRecipientUpdate ?? record.lastRecipientUpdateTimeStamp ?? record.lastRecipientTimeStamp ?? '0';
  }
  return record.agentBucketLastUpdateTimeStamp ?? record.lastAgentUpdate ?? record.lastAgentUpdateTimeStamp ?? record.lastAgentTimeStamp ?? '0';
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

function buildPendingRecipientDistributions(
  role: 'Sponsor' | 'Recipient' | 'Agent',
  allRoles: unknown,
  rewardsByAccount: unknown,
  accountKey: unknown,
): { distributions: Record<string, string>; total: bigint } | null {
  const allRoleRecord =
    allRoles && typeof allRoles === 'object' && !Array.isArray(allRoles)
      ? (allRoles as Record<string, unknown>)
      : {};
  const accountRewardsRecord =
    rewardsByAccount && typeof rewardsByAccount === 'object' && !Array.isArray(rewardsByAccount)
      ? (rewardsByAccount as Record<string, unknown>)
      : {};
  const normalizedAccountKey = String(accountKey ?? '').trim().toLowerCase();
  const summedAccountRewards = Object.values(accountRewardsRecord).reduce<{
    pendingRecipientRewards: bigint;
    pendingAgentRewards: bigint;
  }>(
    (acc, entry) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return acc;
      const rewardEntry = entry as Record<string, unknown>;
      const entryAccountKey = String(rewardEntry.accountKey ?? '').trim().toLowerCase();
      if (entryAccountKey && entryAccountKey === normalizedAccountKey) return acc;
      if (Object.prototype.hasOwnProperty.call(rewardEntry, 'pendingRecipientRewards')) {
        acc.pendingRecipientRewards += toPendingRewardsBigInt(rewardEntry.pendingRecipientRewards);
      }
      if (Object.prototype.hasOwnProperty.call(rewardEntry, 'pendingAgentRewards')) {
        acc.pendingAgentRewards += toPendingRewardsBigInt(rewardEntry.pendingAgentRewards);
      }
      return acc;
    },
    { pendingRecipientRewards: 0n, pendingAgentRewards: 0n },
  );
  const recipientDistributionValue =
    summedAccountRewards.pendingRecipientRewards > 0n
      ? summedAccountRewards.pendingRecipientRewards.toString()
      : allRoleRecord.pendingRecipientRewards;
  const agentDistributionValue =
    summedAccountRewards.pendingAgentRewards > 0n
      ? summedAccountRewards.pendingAgentRewards.toString()
      : allRoleRecord.pendingAgentRewards;
  const distributionEntries: Array<[string, unknown]> =
    role === 'Sponsor'
      ? [
          ['pendingRecipientRewards', recipientDistributionValue],
          ['pendingAgentRewards', agentDistributionValue],
        ]
      : role === 'Recipient'
        ? [['pendingAgentRewards', agentDistributionValue]]
        : [];
  const availableEntries = distributionEntries.filter(([, value]) => value !== undefined && value !== null);
  if (availableEntries.length === 0) return null;
  const distributions = Object.fromEntries(
    availableEntries.map(([key, value]) => [key, toPendingRewardsBigInt(value).toString()]),
  );
  const total = Object.values(distributions).reduce(
    (sum, value) => sum + toPendingRewardsBigInt(value),
    0n,
  );
  return { distributions, total };
}

function buildPendingTotalRewardsDisplay(
  totalRewards: string,
  visiblePendingRewardComponents: Record<string, string>,
  pendingRecipientDistributions: { distributions: Record<string, string>; total: bigint } | null,
): Record<string, unknown> {
  const visibleRewardTotal = Object.values(visiblePendingRewardComponents).reduce(
    (sum, value) => sum + toPendingRewardsBigInt(value),
    0n,
  );
  const computedTotal = visibleRewardTotal + (pendingRecipientDistributions?.total ?? 0n);
  const total = computedTotal > 0n ? computedTotal.toString() : totalRewards;
  return {
    __pendingRewardsTotalNode: true,
    total,
    ...visiblePendingRewardComponents,
    ...(pendingRecipientDistributions
      ? { pendingRecipientDistributions: pendingRecipientDistributions.distributions }
      : {}),
  };
}

function isScalarRewardValue(value: unknown): boolean {
  return value == null || ['string', 'number', 'bigint', 'boolean'].includes(typeof value);
}

export function hasPendingRewardsFields(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (record.TYPE === '--PENDING_REWARDS--') return false;
  const type = String(record.TYPE ?? '');
  const isPendingRewardResult =
    type.includes('PENDING') ||
    Object.prototype.hasOwnProperty.call(record, 'accountKey') ||
    record.__pendingRewardsRefreshAction === true;
  if (!isPendingRewardResult) return false;
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
  const lastUpDateTimeStamp = getRoleLastUpdateValue(record, role);
  const timeStampDifference = calculateTimestampDifference(lastUpDateTimeStamp, calculatedTimeStamp);
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
    sponsorBucketLastUpdateTimeStamp,
    recipientBucketLastUpdateTimeStamp,
    agentBucketLastUpdateTimeStamp,
    calculatedTimeDiff,
    TimeDiffFormatted,
    accountSnapshotBefore,
    accountSnapshotAfter,
    steakedBalance,
    steakedQuantity,
    sponsorBucketStakedQuantity,
    recipientBucketStakedQuantity,
    agentBucketStakedQuantity,
    __pendingRewardsRefreshAction,
    __pendingRewardsRefreshAtMs,
    __pendingRewardsRefreshActionName,
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
  void sponsorBucketLastUpdateTimeStamp;
  void recipientBucketLastUpdateTimeStamp;
  void agentBucketLastUpdateTimeStamp;
  void calculatedTimeDiff;
  void TimeDiffFormatted;
  void accountSnapshotBefore;
  void accountSnapshotAfter;
  void sponsorBucketStakedQuantity;
  void recipientBucketStakedQuantity;
  void agentBucketStakedQuantity;
  const pendingRecipientDistributions = buildPendingRecipientDistributions(
    role,
    restRecord.__pendingRewardsAllRoles,
    restRecord.__pendingRewardsByAccount,
    restRecord.accountKey,
  );
  if (isClaimSummary) {
    return {
      ...restRecord,
      TYPE: restRecord.TYPE ?? '--ACCOUNT_PENDING_REWARDS--',
      accountKey: String(restRecord.accountKey ?? ''),
      calculatedFormatted,
      ...visiblePendingRewardComponents,
      pendingTotalRewards: buildPendingTotalRewardsDisplay(
        pendingRewards,
        visiblePendingRewardComponents,
        pendingRecipientDistributions,
      ),
      __showEmptyFields: true,
    };
  }

  const normalizedResult: Record<string, unknown> = {
    TYPE: restRecord.TYPE ?? '--ACCOUNT_PENDING_REWARDS--',
    accountKey: String(restRecord.accountKey ?? ''),
    steakedBalance: formatTokenQuantityValue(
      steakedBalance ??
        steakedQuantity ??
        (role === 'Sponsor'
          ? record.sponsorBucketStakedQuantity
          : role === 'Recipient'
            ? record.recipientBucketStakedQuantity
            : record.agentBucketStakedQuantity),
    ),
    lastUpDateTimeStamp: formatSecondsValue(lastUpDateTimeStamp),
    lastUpDateFormatted: calculateFormattedDT(lastUpDateTimeStamp),
    calculatedTimeStamp: formatSecondsValue(calculatedTimeStamp),
    calculatedFormatted,
    timeStampDifference: formatSecondsValue(timeStampDifference),
    differenceFormatted: formatTimestampDifference(timeStampDifference),
    ...visiblePendingRewardComponents,
    pendingTotalRewards: buildPendingTotalRewardsDisplay(
      pendingRewards,
      visiblePendingRewardComponents,
      pendingRecipientDistributions,
    ),
    __showEmptyFields: true,
  };
  if (__pendingRewardsRefreshAction !== undefined) normalizedResult.__pendingRewardsRefreshAction = __pendingRewardsRefreshAction;
  if (__pendingRewardsRefreshAtMs !== undefined) normalizedResult.__pendingRewardsRefreshAtMs = __pendingRewardsRefreshAtMs;
  if (__pendingRewardsRefreshActionName !== undefined) normalizedResult.__pendingRewardsRefreshActionName = __pendingRewardsRefreshActionName;
  if (restRecord.__pendingRewardsAllRoles !== undefined) {
    normalizedResult.__pendingRewardsAllRoles = restRecord.__pendingRewardsAllRoles;
  }
  if (restRecord.__pendingRewardsByAccount !== undefined) {
    normalizedResult.__pendingRewardsByAccount = restRecord.__pendingRewardsByAccount;
  }
  return normalizedResult;
}
