/**
 * Truncates a long address by keeping `start` chars at the front and `end`
 * chars at the back, joined with "...". Safe to call on any string.
 */
export function truncateMiddle(addr: string, start = 10, end = 8): string {
  return addr.length > start + end + 3
    ? `${addr.slice(0, start)}...${addr.slice(-end)}`
    : addr;
}
