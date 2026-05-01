export const ACCOUNT_POPUP_TRACE_FILE = 'logs/sponsorCoinLab-account-popup-trace.log';
export const ACCOUNT_POPUP_TRACE_ENDPOINT = '/api/spCoin/lab/account-popup-trace';
export const ACCOUNT_POPUP_TRACE_STORAGE_KEY = 'SponsorCoinLab:accountPopupTrace';

const ACCOUNT_TRACE_PATTERN =
  /\[EXPAND\]|\[ACCOUNT_EXPAND_TRACE\]|\[ACCOUNT_POPUP_TRACE\]|\[JSON_INSPECTOR_TRACE\]|Lazy-loaded|Inline account record/i;
const MAX_LOCAL_TRACE_LINES = 250;

export function isSponsorCoinLabAccountTraceLine(line: unknown) {
  return ACCOUNT_TRACE_PATTERN.test(String(line ?? ''));
}

function appendLocalTrace(line: string) {
  if (typeof window === 'undefined') return;
  try {
    const previous = window.localStorage.getItem(ACCOUNT_POPUP_TRACE_STORAGE_KEY);
    const parsed = previous ? (JSON.parse(previous) as unknown) : [];
    const lines = Array.isArray(parsed) ? parsed.map((entry) => String(entry ?? '')) : [];
    lines.push(`${new Date().toISOString()} ${line}`);
    window.localStorage.setItem(
      ACCOUNT_POPUP_TRACE_STORAGE_KEY,
      JSON.stringify(lines.slice(-MAX_LOCAL_TRACE_LINES)),
    );
  } catch {
    // Trace must never interfere with the UI path being traced.
  }
}

export function recordSponsorCoinLabAccountTrace(line: unknown, source = 'SponsorCoinLab') {
  if (typeof window === 'undefined') return;
  const traceLine = String(line ?? '').trim();
  if (!traceLine || !isSponsorCoinLabAccountTraceLine(traceLine)) return;

  appendLocalTrace(traceLine);

  try {
    void fetch(ACCOUNT_POPUP_TRACE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        line: traceLine,
        source,
        href: window.location.href,
      }),
      cache: 'no-store',
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Keep browser tracing best-effort.
  }
}
