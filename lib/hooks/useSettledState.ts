// File: lib/hooks/useSettledState.ts
import { useEffect } from 'react';
import type React from 'react';

type AnySetter<T> =
  | ((value: T) => void)
  | React.Dispatch<React.SetStateAction<T>>;

/** Ensures state equals `desired`. Returns true when settled. */
export function useSettledState<T>(
  [value, setValue]: [T, AnySetter<T>],
  desired: T
): boolean {
  const settled = Object.is(value, desired);
  useEffect(() => {
    if (!settled) (setValue as any)(desired);
  }, [settled, desired, setValue]);
  return settled;
}

/** Enforce boolean `desired` only while `enabled` is true. Returns true when settled. */
export function useEnsureBoolWhen(
  [value, setValue]: [boolean, AnySetter<boolean>],
  desired: boolean,
  enabled: boolean
): boolean {
  const settled = value === desired;
  useEffect(() => {
    if (enabled && !settled) (setValue as any)(desired);
  }, [enabled, settled, desired, setValue]);
  return settled;
}
