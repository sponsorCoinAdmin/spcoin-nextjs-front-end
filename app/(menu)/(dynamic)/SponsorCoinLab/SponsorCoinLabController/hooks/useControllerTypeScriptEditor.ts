'use client';

import { useCallback, useEffect, useState } from 'react';
import type { OutputPanelMode } from '../types';

type JavaScriptScriptLike = {
  displayFilePath?: string;
  filePath?: string;
  focusPattern?: string;
  name?: string;
  id?: string | number;
} | null | undefined;

type Props = {
  selectedJavaScriptScript: JavaScriptScriptLike;
  selectedJavaScriptScriptId: string;
  scriptEditorKind: string;
  setOutputPanelMode: (value: OutputPanelMode) => void;
  setStatus: (value: string) => void;
};

export function useControllerTypeScriptEditor({
  selectedJavaScriptScript,
  selectedJavaScriptScriptId,
  scriptEditorKind,
  setOutputPanelMode,
  setStatus,
}: Props) {
  const [javaScriptFileContent, setJavaScriptFileContent] = useState('');
  const [isJavaScriptFileLoading, setIsJavaScriptFileLoading] = useState(false);
  const [isTypeScriptEditEnabled, setIsTypeScriptEditEnabled] = useState(false);
  const [isSavingSelectedTypeScriptFile, setIsSavingSelectedTypeScriptFile] = useState(false);

  const selectedJavaScriptDisplayFilePath = String(
    selectedJavaScriptScript?.displayFilePath || selectedJavaScriptScript?.filePath || '',
  ).trim();
  const selectedTypeScriptFocusPattern = String(selectedJavaScriptScript?.focusPattern || '').trim();

  const formatFocusedTypeScriptContent = useCallback((content: string, filePath: string, focusPattern: string) => {
    if (!focusPattern) return content;
    const lines = String(content || '').split(/\r?\n/);
    const focusIndex = lines.findIndex((line) => line.includes(focusPattern));
    if (focusIndex < 0) return content;
    const start = Math.max(0, focusIndex - 8);
    const end = Math.min(lines.length, focusIndex + 13);
    const excerpt = lines.slice(start, end).join('\n');
    return `// File: ${filePath}\n// Focus: ${focusPattern}\n// Showing excerpt around the selected method.\n\n${excerpt}`;
  }, []);

  const reloadJavaScriptFile = useCallback((options?: { applyFocus?: boolean }) => {
    if (!selectedJavaScriptDisplayFilePath) {
      setJavaScriptFileContent('');
      return;
    }
    const applyFocus = options?.applyFocus !== false;
    setIsJavaScriptFileLoading(true);
    void (async () => {
      try {
        const response = await fetch(
          `/api/spCoin/javascript-scripts?filePath=${encodeURIComponent(selectedJavaScriptDisplayFilePath)}`,
          { cache: 'no-store' },
        );
        const payload = (await response.json()) as { ok?: boolean; message?: string; content?: string };
        if (!response.ok) {
          throw new Error(payload?.message || `Unable to load TypeScript file (${response.status})`);
        }
        const content = String(payload?.content || '');
        setJavaScriptFileContent(
          applyFocus
            ? formatFocusedTypeScriptContent(content, selectedJavaScriptDisplayFilePath, selectedTypeScriptFocusPattern)
            : content,
        );
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Unable to load TypeScript file.');
        setOutputPanelMode('raw_status');
      } finally {
        setIsJavaScriptFileLoading(false);
      }
    })();
  }, [
    formatFocusedTypeScriptContent,
    selectedJavaScriptDisplayFilePath,
    selectedTypeScriptFocusPattern,
    setOutputPanelMode,
    setStatus,
  ]);

  useEffect(() => {
    if (scriptEditorKind !== 'javascript') return;
    if (!selectedJavaScriptDisplayFilePath) {
      setJavaScriptFileContent('');
      return;
    }
    setIsTypeScriptEditEnabled(false);
    reloadJavaScriptFile({ applyFocus: true });
  }, [reloadJavaScriptFile, scriptEditorKind, selectedJavaScriptDisplayFilePath, selectedJavaScriptScriptId]);

  useEffect(() => {
    if (scriptEditorKind !== 'javascript' || !selectedJavaScriptDisplayFilePath) return;
    reloadJavaScriptFile({ applyFocus: !isTypeScriptEditEnabled });
  }, [isTypeScriptEditEnabled, reloadJavaScriptFile, scriptEditorKind, selectedJavaScriptDisplayFilePath]);

  const canEditSelectedTypeScriptFile = Boolean(String(selectedJavaScriptDisplayFilePath || '').trim());

  const saveSelectedTypeScriptFile = useCallback(() => {
    if (!selectedJavaScriptDisplayFilePath) {
      setStatus('Select a TypeScript file first.');
      setOutputPanelMode('raw_status');
      return;
    }
    setIsSavingSelectedTypeScriptFile(true);
    void (async () => {
      try {
        const response = await fetch('/api/spCoin/javascript-scripts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filePath: selectedJavaScriptDisplayFilePath,
            content: javaScriptFileContent,
          }),
        });
        const payload = (await response.json()) as { ok?: boolean; message?: string };
        if (!response.ok) {
          throw new Error(payload?.message || `Unable to save TypeScript file (${response.status})`);
        }
        setStatus(`Saved ${String(selectedJavaScriptScript?.name || selectedJavaScriptDisplayFilePath)}.`);
        setOutputPanelMode('raw_status');
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Unable to save TypeScript file.');
        setOutputPanelMode('raw_status');
      } finally {
        setIsSavingSelectedTypeScriptFile(false);
      }
    })();
  }, [javaScriptFileContent, selectedJavaScriptDisplayFilePath, selectedJavaScriptScript?.name, setOutputPanelMode, setStatus]);

  const runSelectedJavaScriptScript = useCallback(() => {
    const scriptName = String(selectedJavaScriptScript?.name || '').trim();
    if (!scriptName) {
      setStatus('Select a TypeScript file first.');
    } else {
      setStatus(`TypeScript execution is not connected yet for ${scriptName}.`);
    }
    setOutputPanelMode('raw_status');
  }, [selectedJavaScriptScript?.name, setOutputPanelMode, setStatus]);

  const addSelectedJavaScriptScriptToScript = useCallback(() => {
    const scriptName = String(selectedJavaScriptScript?.name || '').trim();
    if (!scriptName) {
      setStatus('Select a TypeScript file first.');
    } else {
      setStatus(`Queue In JSON Flow is not connected yet for ${scriptName}.`);
    }
    setOutputPanelMode('raw_status');
  }, [selectedJavaScriptScript?.name, setOutputPanelMode, setStatus]);

  return {
    javaScriptFileContent,
    setJavaScriptFileContent,
    isJavaScriptFileLoading,
    isTypeScriptEditEnabled,
    setIsTypeScriptEditEnabled,
    isSavingSelectedTypeScriptFile,
    selectedJavaScriptDisplayFilePath,
    canEditSelectedTypeScriptFile,
    saveSelectedTypeScriptFile,
    runSelectedJavaScriptScript,
    addSelectedJavaScriptScriptToScript,
  };
}
