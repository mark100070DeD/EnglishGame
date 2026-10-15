/** Turns origin patterns like "https://app*.vercel.app" into exact-match regular expressions. */
export function toOriginMatchers(patterns: readonly string[]): RegExp[] {
  return patterns.map((pattern) => {
    const source = pattern
      .replace(/\/+$/, '')
      .split('*')
      .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
      .join('[a-z0-9-]*');
    return new RegExp(`^${source}$`, 'i');
  });
}
