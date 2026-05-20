export type TreePayloadBlockEntry = {
  raw: string;
  index: number;
  payload: Record<string, unknown> | null;
};

export function parseTreePayload(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function buildTreePayloadBlockEntries(rawDisplay: string) {
  const blocks = rawDisplay
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  const blockEntries: TreePayloadBlockEntry[] =
    blocks.length > 1
      ? blocks.map((raw, index) => ({ raw, index, payload: parseTreePayload(raw) }))
      : [{ raw: rawDisplay, index: 0, payload: parseTreePayload(rawDisplay) }];
  return { blocks, blockEntries };
}

export function selectTreePayloadCandidateEntries(
  blockEntries: TreePayloadBlockEntry[],
  hintedBlockIndex: number,
) {
  return Number.isInteger(hintedBlockIndex) && hintedBlockIndex >= 0 && hintedBlockIndex < blockEntries.length
    ? [blockEntries[hintedBlockIndex]]
    : blockEntries;
}

export function readPathValue(source: unknown, segments: string[]): unknown {
  return segments.reduce<unknown>((currentValue, segment) => {
    if (currentValue == null) return undefined;
    if (Array.isArray(currentValue)) {
      const index = Number(segment);
      return Number.isInteger(index) ? currentValue[index] : undefined;
    }
    if (typeof currentValue !== 'object') return undefined;
    return (currentValue as Record<string, unknown>)[segment];
  }, source);
}

export function writePathValue(source: unknown, segments: string[], nextValue: unknown): unknown {
  if (segments.length === 0) return nextValue;
  const [head, ...tail] = segments;
  if (Array.isArray(source)) {
    const index = Number(head);
    if (!Number.isInteger(index) || index < 0 || index >= source.length) return source;
    const nextArray = [...source];
    nextArray[index] = writePathValue(nextArray[index], tail, nextValue);
    return nextArray;
  }
  if (!source || typeof source !== 'object') return source;
  return {
    ...(source as Record<string, unknown>),
    [head]: writePathValue((source as Record<string, unknown>)[head], tail, nextValue),
  };
}

export function readDisplayPathValue(source: unknown, segments: string[]): unknown {
  const directValue = readPathValue(source, segments);
  if (directValue !== undefined) return directValue;
  const parametersIndex = segments.findIndex((segment) => segment === 'parameters');
  if (parametersIndex < 1) return directValue;
  return readPathValue(source, [
    ...segments.slice(0, parametersIndex),
    'call',
    ...segments.slice(parametersIndex),
  ]);
}
