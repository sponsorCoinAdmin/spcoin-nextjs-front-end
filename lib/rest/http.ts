// File: lib/rest/http.ts
/* Minimal GET-only REST helpers with timeout, retries, and type-safe JSON parsing. */

export type GetOptions = {
  timeoutMs?: number;     // default 6000
  retries?: number;       // default 1 (total attempts = retries + 1)
  init?: RequestInit;     // extra options (headers, credentials, etc.)
  backoffMs?: number;     // base backoff in ms between retries (default 300)
};

export type JsonOptions = GetOptions & {
  accept?: string;        // default 'application/json'
  forceParse?: boolean;   // parse JSON even if content-type is wrong (default false)
};

/** Rich HTTP error that includes status and a small body preview. */
export class HttpError extends Error {
  constructor(
    message: string,
    public readonly url: string,
    public readonly status: number,
    public readonly statusText: string,
    public readonly bodyPreview?: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

function startAbortTimer(ms: number | undefined) {
  const ctrl = new AbortController();
  const timer = typeof ms === 'number' && ms > 0
    ? setTimeout(() => ctrl.abort(), ms)
    : null;
  return { ctrl, clear: () => { if (timer) clearTimeout(timer); } };
}

function isTransientError(err: unknown): boolean {
  // Fetch often throws TypeError on network errors in some environments.
  const msg = (err as Error)?.message ?? '';
  return (
    (err instanceof DOMException && err.name === 'AbortError') ||
    err instanceof TypeError ||
    msg.includes('Failed to Get') ||
    msg.includes('NetworkError') ||
    msg.includes('network')
  );
}

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

/** Heuristic: use cache:'force-cache' for same-origin static paths; 'no-store' for absolute URLs/APIs. */
function defaultCacheFor(url: string): RequestCache {
  return url.startsWith('/') ? 'force-cache' : 'no-store';
}

/** Low-level GET that returns the raw Response (2xx only unless `init.redirect` changes semantics). */
export async function get(url: string, opts: GetOptions = {}): Promise<Response> {
  const {
    timeoutMs = 6000,
    retries = 1,
    init,
    backoffMs = 300,
  } = opts;

  let attempt = 0;
  let lastErr: unknown;

  while (attempt <= retries) {
    const { ctrl, clear } = startAbortTimer(timeoutMs);
    try {
      const res = await fetch(url, {
        method: 'GET',
        signal: ctrl.signal,
        cache: init?.cache ?? defaultCacheFor(url),
        ...init,
      });
      clear();

      if (!res.ok) {
        // retry on 5xx
        if (res.status >= 500 && res.status < 600 && attempt < retries) {
          attempt++;
          // exponential backoff with a bit of jitter
          const delay = Math.round(backoffMs * Math.pow(2, attempt - 1) * (0.85 + Math.random() * 0.3));
          await sleep(delay);
          continue;
        }

        // include a small body preview to aid debugging
        let preview = '';
        try { preview = (await res.text()).slice(0, 200); } catch {}
        throw new HttpError(
          `GET ${url} failed: ${res.status} ${res.statusText}`,
          url,
          res.status,
          res.statusText,
          preview
        );
      }

      return res;
    } catch (err) {
      clear();
      if (isTransientError(err) && attempt < retries) {
        attempt++;
        const delay = Math.round(backoffMs * Math.pow(2, attempt - 1) * (0.85 + Math.random() * 0.3));
        await sleep(delay);
        lastErr = err;
        continue;
      }
      throw err;
    }
  }
  throw lastErr ?? new Error(`GET ${url} failed`);
}

/** Convenience: GET + parse JSON, with optional permissive parsing when servers mislabel content-type. */
export async function getJson<T>(url: string, opts: JsonOptions = {}): Promise<T> {
  const { accept = 'application/json', forceParse = false, ...rest } = opts;
  const res = await get(url, {
    ...rest,
    init: {
      ...(rest.init ?? {}),
      headers: {
        Accept: accept,
        ...(rest.init?.headers ?? {}),
      },
    },
  });

  const ctype = res.headers.get('content-type') ?? '';
  // allow structured suffixes like application/*+json
  const looksLikeJson = /\bjson\b/i.test(ctype);

  if (looksLikeJson || forceParse) {
    return (await res.json()) as T;
  }

  // still try to parse, but warn with a better error if it fails
  try {
    return (await res.json()) as T;
  } catch {
    const text = await res.text().catch(() => '');
    throw new HttpError(
      `Expected JSON but got '${ctype}'.`,
      url,
      res.status,
      res.statusText,
      text.slice(0, 200)
    );
  }
}

/** Convenience: GET plain text. */
export async function getText(url: string, opts: GetOptions = {}): Promise<string> {
  const res = await get(url, {
    ...opts,
    init: {
      ...(opts.init ?? {}),
      headers: { Accept: 'text/plain, text/*;q=0.9, */*;q=0.1', ...(opts.init?.headers ?? {}) },
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
export async function headOk(
  url: string,
  opts: Omit<GetOptions, 'retries'> & { retries?: number } = {}
): Promise<boolean> {
  const { timeoutMs = 4000, retries = 0, init } = opts;
  let attempt = 0;

  while (attempt <= retries) {
    const { ctrl, clear } = startAbortTimer(timeoutMs);
    try {
      const res = await fetch(url, { method: 'HEAD', signal: ctrl.signal, cache: init?.cache ?? defaultCacheFor(url), ...init });
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
