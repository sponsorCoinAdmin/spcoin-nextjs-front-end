// File: lib/rest/http.ts
/* Minimal GET-only REST helpers with timeout, retries, and type-safe JSON parsing. */

export type GetOptions = {
  timeoutMs?: number;     // default 6000
  retries?: number;       // default 1 (total attempts = retries + 1)
  init?: RequestInit;     // extra fetch options (headers, credentials, etc.)
};

export type JsonOptions = GetOptions & {
  accept?: string;        // default 'application/json'
};

function startAbortTimer(ms: number | undefined) {
  const ctrl = new AbortController();
  const timer = typeof ms === 'number' && ms > 0
    ? setTimeout(() => ctrl.abort(), ms)
    : null;
  return { ctrl, clear: () => { if (timer) clearTimeout(timer); } };
}

function isTransientError(err: unknown): boolean {
  const msg = (err as Error)?.message ?? '';
  return (
    (err instanceof DOMException && err.name === 'AbortError') ||
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('network')
  );
}

/** Low-level GET that returns the raw Response (2xx only unless `init.redirect` changes semantics). */
export async function get(url: string, opts: GetOptions = {}): Promise<Response> {
  const { timeoutMs = 6000, retries = 1, init } = opts;
  let attempt = 0;
  let lastErr: unknown;

  while (attempt <= retries) {
    const { ctrl, clear } = startAbortTimer(timeoutMs);
    try {
      const res = await fetch(url, { method: 'GET', signal: ctrl.signal, cache: 'force-cache', ...init });
      clear();

      if (!res.ok) {
        // retry on 5xx
        if (res.status >= 500 && res.status < 600 && attempt < retries) {
          attempt++;
          continue;
        }
        throw new Error(`GET ${url} failed: ${res.status}`);
      }
      return res;
    } catch (err) {
      clear();
      if (isTransientError(err) && attempt < retries) {
        attempt++;
        lastErr = err;
        continue;
      }
      throw err;
    }
  }
  throw lastErr ?? new Error(`GET ${url} failed`);
}

/** Convenience: GET + parse JSON, ensures Content-Type indicates JSON. */
export async function getJson<T>(url: string, opts: JsonOptions = {}): Promise<T> {
  const { accept = 'application/json', ...rest } = opts;
  const res = await get(url, {
    ...rest,
    init: {
      ...(rest.init ?? {}),
      headers: {
        'Accept': accept,
        ...(rest.init?.headers ?? {}),
      },
    },
  });

  const ctype = res.headers.get('content-type') ?? '';
  // allow structured suffixes like application/*+json
  const isJson = /\bjson\b/i.test(ctype);
  if (!isJson) {
    // still try to parse, but warn with a better error if it fails
    try {
      return (await res.json()) as T;
    } catch {
      const text = await res.text().catch(() => '');
      throw new Error(`Expected JSON but got '${ctype}'. Body preview: ${text.slice(0, 200)}`);
    }
  }
  return (await res.json()) as T;
}

/** Convenience: GET plain text. */
export async function getText(url: string, opts: GetOptions = {}): Promise<string> {
  const res = await get(url, {
    ...opts,
    init: {
      ...(opts.init ?? {}),
      headers: { 'Accept': 'text/plain, text/*;q=0.9, */*;q=0.1', ...(opts.init?.headers ?? {}) },
    },
  });
  return await res.text();
}

/** Convenience: GET as ArrayBuffer (binary). */
export async function getBinary(url: string, opts: GetOptions = {}): Promise<ArrayBuffer> {
  const res = await get(url, opts);
  return await res.arrayBuffer();
}

/** Lightweight HEAD probe (useful on same-origin resources). */
export async function headOk(url: string, opts: Omit<GetOptions, 'retries'> & { retries?: number } = {}): Promise<boolean> {
  const { timeoutMs = 4000, retries = 0, init } = opts;
  let attempt = 0;

  while (attempt <= retries) {
    const { ctrl, clear } = startAbortTimer(timeoutMs);
    try {
      const res = await fetch(url, { method: 'HEAD', signal: ctrl.signal, ...init });
      clear();
      // Many CDNs return 405 for HEAD; consider any 2xx/3xx a pass.
      return res.status >= 200 && res.status < 400;
    } catch (err) {
      clear();
      if (isTransientError(err) && attempt < retries) {
        attempt++;
        continue;
      }
      return false;
    }
  }
  return false;
}

/** Utility: ensure protocol for external URLs; leaves `/relative` paths unchanged. */
export function withProtocol(u?: string | null): string | undefined {
  if (!u) return undefined;
  const v = u.trim();
  if (!v) return undefined;
  if (v.startsWith('/') || v.startsWith('http://') || v.startsWith('https://')) return v;
  return `https://${v}`;
}
