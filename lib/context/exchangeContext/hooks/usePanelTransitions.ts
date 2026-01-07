'use client';

import { useCallback } from 'react';
import type { MouseEvent, MouseEventHandler } from 'react';

import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePerfMarks } from '@/lib/hooks/perf/usePerfMarks';

type OpenOpts = { methodName?: string };

type ClickOpts = OpenOpts & {
  preventDefault?: boolean;
  stopPropagation?: boolean;
  defer?: boolean;
};

export function usePanelTransitions() {
  const { openPanel, closePanel } = usePanelTree();
  const perf = usePerfMarks('panelTransition');

  const toClickHandler = <T extends HTMLElement>(
    act: (opts?: OpenOpts) => void,
    base?: ClickOpts,
  ): MouseEventHandler<T> => {
    const {
      preventDefault = true,
      stopPropagation = true,
      defer = true,
      methodName,
    } = base ?? {};

    return (e: MouseEvent<T>) => {
      if (preventDefault) e.preventDefault();
      if (stopPropagation) e.stopPropagation();

      const runner = () => act({ methodName });

      if (defer) {
        if (typeof queueMicrotask === 'function') queueMicrotask(runner);
        else void Promise.resolve().then(runner);
      } else {
        runner();
      }
    };
  };

  /** OPEN (stack-aware) */
  const openOverlay = useCallback(
    (panel: SP_COIN_DISPLAY, opts?: OpenOpts) => {
      const name = SP_COIN_DISPLAY[panel];
      const methodName = opts?.methodName ? `(${opts.methodName})` : '';
      perf.start();
      openPanel(panel, `usePanelTransitions:openOverlay${methodName}(${name})`);
      perf.end(`openOverlay:${panel}`);
    },
    [openPanel, perf],
  );

  /** CLOSE TOP (stack POP) */
  const closeTop = useCallback(
    (invoker?: string, arg?: unknown) => {
      perf.start();
      closePanel(invoker ?? 'usePanelTransitions:closeTop(pop)', arg);
      perf.end('closeTop');
    },
    [closePanel, perf],
  );

  /** Click-safe opener */
  const openOverlayClick = useCallback(
    <T extends HTMLElement>(panel: SP_COIN_DISPLAY, opts?: ClickOpts) =>
      toClickHandler<T>((o) => openOverlay(panel, o), opts),
    [openOverlay],
  );

  /** Click-safe closeTop */
  const closeTopClick = useCallback(
    <T extends HTMLElement>(opts?: ClickOpts & { invoker?: string; arg?: unknown }) =>
      toClickHandler<T>(() => closeTop(opts?.invoker, opts?.arg), opts),
    [closeTop],
  );

  return {
    // core
    openOverlay,
    closeTop,

    // click-safe
    openOverlayClick,
    closeTopClick,
  };
}
