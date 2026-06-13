// File: lib/context/exchangeContext/hooks/useEnforceRadioPanelGroups.ts
'use client';

import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';

import { panelStore } from '@/lib/context/exchangeContext/panelStore';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { SP_COIN_DISPLAY } from '@/lib/structure';

interface RadioPanelGroup {
  name: string;
  members: readonly SP_COIN_DISPLAY[];
}

const makeVisibleKey = (members: readonly SP_COIN_DISPLAY[]) =>
  members
    .filter((panel) => panelStore.getPanelSnapshot(panel))
    .map(Number)
    .join(',');

const makeGroupsKey = (groups: readonly RadioPanelGroup[]) =>
  groups.map((group) => `${group.name}:${makeVisibleKey(group.members)}`).join('|');

const parseVisibleKey = (key: string): SP_COIN_DISPLAY[] =>
  key
    ? key
        .split(',')
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value))
        .map((value) => value as SP_COIN_DISPLAY)
    : [];

const normalizeGroups = (groups: readonly RadioPanelGroup[]): RadioPanelGroup[] =>
  groups.map((group) => {
    const seen = new Set<number>();
    return {
      name: group.name,
      members: group.members.filter((panel) => {
        const id = Number(panel);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      }),
    };
  });

export function useEnforceRadioPanelGroups(groups: readonly RadioPanelGroup[]) {
  const { closePanel } = usePanelTree();
  const previousVisibleKeysRef = useRef(new Map<string, string>());

  const normalizedGroups = useMemo(() => normalizeGroups(groups), [groups]);
  const allMembers = useMemo(() => {
    const seen = new Set<number>();
    const members: SP_COIN_DISPLAY[] = [];

    for (const group of normalizedGroups) {
      for (const panel of group.members) {
        const id = Number(panel);
        if (seen.has(id)) continue;
        seen.add(id);
        members.push(panel);
      }
    }

    return members;
  }, [normalizedGroups]);

  const groupsKey = useSyncExternalStore(
    (callback) => {
      const unsubscribers = allMembers.map((panel) =>
        panelStore.subscribePanel(panel, callback),
      );

      return () => {
        for (const unsubscribe of unsubscribers) unsubscribe();
      };
    },
    () => makeGroupsKey(normalizedGroups),
    () => '',
  );

  useEffect(() => {
    for (const group of normalizedGroups) {
      const visibleKey = makeVisibleKey(group.members);
      const previousVisibleKey = previousVisibleKeysRef.current.get(group.name) ?? '';
      const visiblePanels = parseVisibleKey(visibleKey);
      const previousVisiblePanels = parseVisibleKey(previousVisibleKey);

      previousVisibleKeysRef.current.set(group.name, visibleKey);

      if (visiblePanels.length <= 1) continue;

      const previousVisible = new Set(previousVisiblePanels.map(Number));
      const newlyVisiblePanels = visiblePanels.filter(
        (panel) => !previousVisible.has(Number(panel)),
      );

      const winningPanel =
        newlyVisiblePanels[newlyVisiblePanels.length - 1] ?? visiblePanels[0];
      const winningPanelId = Number(winningPanel);

      for (const panel of visiblePanels) {
        if (Number(panel) === winningPanelId) continue;

        closePanel(
          panel,
          `useEnforceRadioPanelGroups:${group.name}:closeOther:${SP_COIN_DISPLAY[winningPanel]}`,
        );
      }
    }
  }, [closePanel, groupsKey, normalizedGroups]);
}
