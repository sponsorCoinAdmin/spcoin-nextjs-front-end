// File: @/lib/context/exchangeContext/panelStore.ts
'use client';

import type { SP_COIN_DISPLAY } from '@/lib/structure';

export type PanelId = SP_COIN_DISPLAY;
export type Listener = () => void;

class PanelStore {
  private state = new Map<PanelId, boolean>();
  private listeners = new Map<PanelId, Set<Listener>>();

  // Defer notifications to post-commit and coalesce duplicates
  private pending = new Set<PanelId>();
  private scheduled = false;

  // --- reads --------------------------------------------------

  isVisible = (id: PanelId): boolean => this.state.get(id) ?? false;

  // Alias kept for existing callers
  getPanelSnapshot = (id: PanelId): boolean => this.state.get(id) ?? false;

  // Tooling/inspection
  getAll = (): Map<PanelId, boolean> => new Map(this.state);

  // --- writes -------------------------------------------------

  setVisible = (id: PanelId, visible: boolean) => {
    const prev = this.state.get(id) ?? false;
    if (prev === visible) return;
    this.state.set(id, visible);
    this.queueEmit(id);
  };

  // Overloads: (id) or (id, parentId)
  openPanel(id: PanelId): void;
  openPanel(id: PanelId, parentId: PanelId): void;
  openPanel(id: PanelId, parentId?: PanelId): void {
    if (typeof parentId === 'number') this.setVisible(parentId, true);
    this.setVisible(id, true);
  }

  // Overloads: (id) or (id, parentId)
  closePanel(id: PanelId): void;
  closePanel(id: PanelId, parentId: PanelId): void;
  closePanel(id: PanelId, parentId?: PanelId): void {
    this.setVisible(id, false);
    if (typeof parentId === 'number') this.setVisible(parentId, false);
  }

  // --- subscribe ---------------------------------------------

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

  // --- internals ---------------------------------------------

  private queueEmit(id: PanelId) {
    this.pending.add(id);
    if (this.scheduled) return;
    this.scheduled = true;

    // Notify after React commit
    setTimeout(() => this.flushNow(), 0);
  }

  private flushNow() {
    this.scheduled = false;
    const toNotify = Array.from(this.pending);
    this.pending.clear();
    for (const pid of toNotify) this.emitNow(pid);
  }

  private emitNow(id: PanelId) {
    const set = this.listeners.get(id);
    if (!set) return;

    // ✅ Copy listeners to avoid mutation issues during emit
    for (const fn of Array.from(set)) fn();
  }
}

export const panelStore = new PanelStore();
