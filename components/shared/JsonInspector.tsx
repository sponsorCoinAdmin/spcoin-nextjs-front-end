'use client';

import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import React, { useCallback } from 'react';

interface JsonInspectorProps {
  data: any;
  collapsedKeys: string[];
  updateCollapsedKeys: (next: string[]) => void;
  level?: number;
  path?: string;
  rootLabel?: string;
  label?: string;
}

const JsonInspector: React.FC<JsonInspectorProps> = ({
  data,
  collapsedKeys,
  updateCollapsedKeys,
  level = 0,
  path = 'root',
  rootLabel = 'Exchange Context',
  label,
}) => {
  const isCollapsed = collapsedKeys.includes(path ?? '');

  const toggle = useCallback(() => {
    updateCollapsedKeys(
      isCollapsed
        ? collapsedKeys.filter((key) => key !== path)
        : [...new Set([...collapsedKeys, path!])],
    );
  }, [isCollapsed, collapsedKeys, updateCollapsedKeys, path]);

  const getValueColor = (value: any): string => {
    if (value === false || value === undefined || value === null) return 'text-red-500';
    if (typeof value === 'boolean') return 'text-yellow-300';
    return 'text-green-400';
  };

  const getPathLabel = (nextPath: string): string => {
    if (label) return label;
    if (nextPath === 'root') return rootLabel;
    if (nextPath === 'tradeData.slippage') return 'slippage';
    const segments = nextPath.split('.');
    return segments[segments.length - 1] || nextPath;
  };

  const renderValue = (value: any, key: string) => {
    const nextPath = `${path}.${key}`;
    if (value && typeof value === 'object') {
      return (
        <JsonInspector
          key={nextPath}
          data={value}
          collapsedKeys={collapsedKeys}
          updateCollapsedKeys={updateCollapsedKeys}
          level={level + 1}
          path={nextPath}
          rootLabel={rootLabel}
          label={key}
        />
      );
    }

    return (
      <div key={nextPath} className="ml-4 whitespace-nowrap">
        <span className="text-[#5981F3]">{key}</span>: <span className={getValueColor(value)}>{stringifyBigInt(value)}</span>
      </div>
    );
  };

  return (
    <div className={`${level > 0 ? 'ml-2' : ''} font-mono leading-tight`}>
      <div className="cursor-pointer whitespace-nowrap" onClick={toggle}>
        <span className={isCollapsed ? 'text-green-400' : 'text-red-400'}>{isCollapsed ? '[+]' : '[-]'}</span>{' '}
        <span className="font-semibold text-white">{getPathLabel(path ?? '')}</span>
      </div>
      {!isCollapsed && <div className="ml-4">{Object.entries(data).map(([key, value]) => renderValue(value, key))}</div>}
    </div>
  );
};

export default JsonInspector;
