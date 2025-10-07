// File: lib/context/exchangeContext/panelStore.ts

import { SP_COIN_DISPLAY } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';

export type PanelId = SP_COIN_DISPLAY;
export type Listener = () => void;

class PanelStore {
  private state = new Map<PanelId, boolean>();
  private listeners = new Map<PanelId, Set<Listener>>();

  // --- read ---
  isVisible = (id: PanelId): boolean => {
    return this.state.get(id) ?? false;
  };

  getPanelSnapshot = (id: PanelId): boolean => {
    return this.state.get(id) ?? false;
  };

  // Useful for debugging / tooling
  getAll = (): Map<PanelId, boolean> => new Map(this.state);

  // --- write ---
  setVisible = (id: PanelId, visible: boolean) => {
    const prev = this.state.get(id) ?? false;
    if (prev === visible) return;
    this.state.set(id, visible);
    this.emit(id);
  };

  openPanel = (id: PanelId) => this.setVisible(id, true);
  closePanel = (id: PanelId) => this.setVisible(id, false);

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

  private emit(id: PanelId) {
    const set = this.listeners.get(id);
    if (!set) return;
    // copy to avoid mutation during iteration
    [...set].forEach((fn) => fn());
  }
}

export const panelStore = new PanelStore();
