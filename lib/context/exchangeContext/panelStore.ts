// File: lib/context/exchangeContext/panelStore.ts

import type { SP_COIN_DISPLAY } from '@/lib/structure';

export type PanelId = SP_COIN_DISPLAY;
export type Listener = () => void;

class PanelStore {
  private state = new Map<PanelId, boolean>();
  private listeners = new Map<PanelId, Set<Listener>>();

  // Batch/deferral
  private pending = new Set<PanelId>();
  private scheduled = false;

  // --- read ---
  isVisible = (id: PanelId): boolean => this.state.get(id) ?? false;
  getPanelSnapshot = (id: PanelId): boolean => this.state.get(id) ?? false;

  // Useful for tooling
  getAll = (): Map<PanelId, boolean> => new Map(this.state);

  // --- write ---
  setVisible = (id: PanelId, visible: boolean) => {
    const prev = this.state.get(id) ?? false;
    if (prev === visible) return;
    this.state.set(id, visible);
    this.queueEmit(id);
  };

  // Overloads allow (id) or (id, parentId)
  openPanel(id: PanelId): void;
  openPanel(id: PanelId, parentId: PanelId): void;
  openPanel(id: PanelId, parentId?: PanelId): void {
    if (typeof parentId === 'number') {
      // Ensure parent is visible first
      this.setVisible(parentId, true);
    }
    this.setVisible(id, true);
  }

  // Overloads allow (id) or (id, parentId)
  closePanel(id: PanelId): void;
  closePanel(id: PanelId, parentId: PanelId): void;
  closePanel(id: PanelId, parentId?: PanelId): void {
    // Close the child first
    this.setVisible(id, false);
    if (typeof parentId === 'number') {
      // Optionally also close the parent if requested
      this.setVisible(parentId, false);
    }
  }

  // --- subscribe ---
  subscribePanel = (id: PanelId, listener: Listener) => {
    let set = this.listeners.get(id);
    if (!set) {
      set = new Set();
      this.listeners.set(id, set);
    }
    set.add(listener);
    return () => {
      set!.delete(listener);
      if (set!.size === 0) this.listeners.delete(id);
    };
  };

  // ─────────── internals ───────────
  private queueEmit(id: PanelId) {
    this.pending.add(id);
    if (this.scheduled) return;
    this.scheduled = true;
    // Use a macrotask to ensure commit phase has finished before notifying subscribers.
    setTimeout(() => {
      this.scheduled = false;
      const toNotify = Array.from(this.pending);
      this.pending.clear();
      for (const pid of toNotify) this.emitNow(pid);
    }, 0);
  }

  private emitNow(id: PanelId) {
    const set = this.listeners.get(id);
    if (!set) return;
    // iterate directly to avoid temporary array allocation
    for (const fn of set) fn();
  }
}

export const panelStore = new PanelStore();
