export const isEmpty = <T>(v: string | T[]) =>
  Array.isArray(v) ? v.length === 0 : v.trim().length === 0;

export const trim = (s: string) => s.trim();

// note: if there are duplicated values, keeps the last occurrence
export const uniqBy = <T>(getKey: (v: T) => string, input: T[]): T[] => {
  const xs = input.reduce((acc: Record<string, T>, current) => {
    const k = getKey(current);
    acc[k] = current;
    return acc;
  }, {});
  return Object.values(xs);
};

export const findDuplicates = <T>(
  getKey: (v: T) => string,
  input: T[]
): string[] => {
  const counts = input.map(getKey).reduce<Record<string, number>>((keys, k) => {
    keys[k] = (keys[k] ?? 0) + 1;
    return keys;
  }, {});

  const duplicateKeys = Object.entries(counts)
    .filter(([_, count]) => count > 1)
    .map(([k, _]) => k);

  return duplicateKeys;
};
