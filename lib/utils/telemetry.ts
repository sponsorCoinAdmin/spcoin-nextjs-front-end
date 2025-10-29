// File: lib/utils/telemetry.ts
// Lightweight, optional telemetry emitter. Safe no-op unless enabled.
// Env flags:
//   NEXT_PUBLIC_TELEMETRY_ENABLED = 'true' | 'false' (default: false)
//   NEXT_PUBLIC_TELEMETRY_DEBUG   = 'true' | 'false' (default: false)
export type TelemetryEvent = {
  name: string;
  ts: number; // epoch ms
  props?: Record<string, unknown>;
};

const ENABLED = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_TELEMETRY_ENABLED === 'true';
const DEBUG   = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_TELEMETRY_DEBUG === 'true';

function _emitConsole(evt: TelemetryEvent) {
  if (!DEBUG) return;
  // eslint-disable-next-line no-console
  console.debug('[telemetry]', evt.name, evt.props ?? {}, new Date(evt.ts).toISOString());
}

function _emitBeacon(evt: TelemetryEvent) {
  // Optional example: publish to a CustomEvent for dev tools; always safe.
  try {
    window.dispatchEvent(new CustomEvent('telemetry', { detail: evt }));
  } catch { /* ignore */ }

}

export const telemetry = {
  enabled: ENABLED,
  emit(name: string, props?: Record<string, unknown>) {
    if (!ENABLED && !DEBUG) return; // fast no-op
    const evt: TelemetryEvent = { name, ts: Date.now(), props };
    _emitConsole(evt);
    if (ENABLED) _emitBeacon(evt);
  },
};
