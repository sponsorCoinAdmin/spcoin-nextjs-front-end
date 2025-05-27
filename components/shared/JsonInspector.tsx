// File: components/shared/JsonInspector.tsx

'use client';

import React, { useCallback } from 'react';

interface JsonInspectorProps {
  data: any;
  collapsedKeys: string[];
  updateCollapsedKeys: (next: string[]) => void;
  level?: number;
  path?: string;
}

const JsonInspector: React.FC<JsonInspectorProps> = ({
  data,
  collapsedKeys,
  updateCollapsedKeys,
  level = 0,
  path = 'root',
}) => {
  const isCollapsed = collapsedKeys.includes(path);

  const toggle = useCallback(() => {
    updateCollapsedKeys(
      isCollapsed
        ? collapsedKeys.filter((key) => key !== path)
        : [...new Set([...collapsedKeys, path])]
    );
  }, [isCollapsed, collapsedKeys, updateCollapsedKeys, path]);

  const getValueColor = (value: any): string => {
    if (value === false || value === undefined || value === null) return 'text-red-500';
    if (typeof value === 'boolean') return 'text-yellow-300';
    return 'text-green-400';
  };

  const renderValue = (value: any, key: string, currentPath: string) => {
    if (value && typeof value === 'object') {
      return (
        <JsonInspector
          key={currentPath}
          data={value}
          collapsedKeys={collapsedKeys}
          updateCollapsedKeys={updateCollapsedKeys}
          level={level + 1}
          path={currentPath}
        />
      );
    }
    return (
      <div key={currentPath} className="ml-4">
        <span className="text-[#5981F3]">{key}</span>: <span className={getValueColor(value)}>{JSON.stringify(value)}</span>
      </div>
    );
  };

  return (
    <div className="ml-2">
      <div className="cursor-pointer" onClick={toggle}>
        <span className="text-green-400">{isCollapsed ? '[+]' : '[-]'}</span>{' '}
        <span className="text-white font-semibold">{path}</span>
      </div>
      {!isCollapsed && (
        <div className="ml-4">
          {Object.entries(data).map(([key, value]) => {
            const newPath = `${path}.${key}`;
            return renderValue(value, key, newPath);
          })}
        </div>
      )}
    </div>
  );
};

export default JsonInspector;
