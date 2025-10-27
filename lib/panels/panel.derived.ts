// File: lib/panels/panel.derived.ts
import { PANELS, GroupId } from './panel.config';
import { SP_COIN_DISPLAY as SP } from '@/lib/structure';

/** Enum label fallback helper */
const enumName = (id: SP) => (SP as any)[id] ?? String(id);

/** Map of id → label (UI-friendly) */
export const LABELS: Record<SP, string> = PANELS.reduce((acc, p) => {
  acc[p.id] = p.label ?? enumName(p.id);
  return acc;
}, {} as Record<SP, string>);

/** Map of id → defaultVisible */
export const DEFAULT_VISIBILITY: Record<SP, boolean> = PANELS.reduce((acc, p) => {
  acc[p.id] = !!p.defaultVisible;
  return acc;
}, {} as Record<SP, boolean>);

/** Parent → children (for the debug/virtual tree UI) */
export const CHILDREN: Partial<Record<SP, SP[]>> = PANELS.reduce((acc, p) => {
  if (p.parent !== undefined) {
    (acc[p.parent] ??= []).push(p.id);
  }
  return acc;
}, {} as Partial<Record<SP, SP[]>>);

/** Panels with no parent (tree roots) */
export const ROOTS: SP[] = PANELS.filter(p => p.parent === undefined).map(p => p.id);

/** Radio group → member ids */
export const GROUP_MEMBERS: Record<GroupId, SP[]> = PANELS.reduce((acc, p) => {
  if (p.group) (acc[p.group] ??= []).push(p.id);
  return acc;
}, {} as Record<GroupId, SP[]>);

/** All panel ids (handy for validation or unions) */
export const ALL_IDS: readonly SP[] = PANELS.map(p => p.id) as readonly SP[];

/** Dev-time sanity checks (optional to call in dev only) */
export function assertPanelConfigValid(devOnly = process.env.NODE_ENV !== 'production') {
  if (!devOnly) return;

  // Unique IDs
  const seen = new Set<number>();
  for (const p of PANELS) {
    if (seen.has(p.id)) throw new Error(`Duplicate panel id in PANELS: ${enumName(p.id)}`);
    seen.add(p.id);
  }

  // Parents exist
  for (const p of PANELS) {
    if (p.parent !== undefined && !seen.has(p.parent)) {
      throw new Error(`Unknown parent for ${enumName(p.id)}: ${enumName(p.parent)}`);
    }
  }

  // Groups non-empty (trivial here, but helps future edits)
  for (const [g, members] of Object.entries(GROUP_MEMBERS)) {
    if (members.length === 0) throw new Error(`Empty group: ${g}`);
  }
}
