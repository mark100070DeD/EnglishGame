const CYRILLIC_FRAGMENT = /\p{Script=Cyrillic}[\p{Script=Cyrillic}'’\- ]*/gu;

/** Distinct Russian/Ukrainian (Cyrillic) fragments found in the given lines, in order of appearance. */
export function findNativeLanguageFragments(lines: readonly string[]): string[] {
  const found = new Set<string>();
  for (const line of lines) {
    for (const match of line.matchAll(CYRILLIC_FRAGMENT)) {
      const fragment = match[0].trim();
      if (fragment) found.add(fragment);
    }
  }
  return [...found];
}
