'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { LabCardId } from '../types';

export function useControllerLayout(cardClassName: string) {
  const [expandedCard, setExpandedCard] = useState<LabCardId | null>(null);
  const methodsCardRef = useRef<HTMLElement | null>(null);
  const [sharedMethodsRowHeight, setSharedMethodsRowHeight] = useState<number | null>(null);
  const [isDesktopSharedLayout, setIsDesktopSharedLayout] = useState(false);

  const toggleExpandedCard = useCallback((cardId: LabCardId) => {
    setExpandedCard((current) => (current === cardId ? null : cardId));
  }, []);

  const showCard = useCallback(
    (cardId: LabCardId) => expandedCard === null || expandedCard === cardId,
    [expandedCard],
  );

  const getCardClassName = useCallback(
    (cardId: LabCardId, placement = '') =>
      `${cardClassName} flex flex-col ${expandedCard === cardId ? 'min-h-[calc(100dvh-10rem)]' : ''} ${placement}`.trim(),
    [cardClassName, expandedCard],
  );

  useEffect(() => {
    const updateViewportMode = () => setIsDesktopSharedLayout(window.innerWidth >= 1280);

    updateViewportMode();
    window.addEventListener('resize', updateViewportMode);
    return () => window.removeEventListener('resize', updateViewportMode);
  }, []);

  useEffect(() => {
    if (!isDesktopSharedLayout || expandedCard !== null) {
      setSharedMethodsRowHeight(null);
      return;
    }

    const node = methodsCardRef.current;
    if (!node) return;

    const updateHeight = () => setSharedMethodsRowHeight(Math.ceil(node.getBoundingClientRect().height));

    updateHeight();

    const resizeObserver = new ResizeObserver(() => updateHeight());
    resizeObserver.observe(node);

    return () => resizeObserver.disconnect();
  }, [expandedCard, isDesktopSharedLayout]);

  return {
    expandedCard,
    setExpandedCard,
    toggleExpandedCard,
    showCard,
    getCardClassName,
    methodsCardRef,
    sharedMethodsRowHeight,
    isDesktopSharedLayout,
  };
}
