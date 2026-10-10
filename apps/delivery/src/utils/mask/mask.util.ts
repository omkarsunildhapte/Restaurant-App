/** The last 4 digits or characters of an ID number, for showing it masked; null when empty. */
export function lastFour(id: string | null): string | null {
  const compact = (id ?? '').replace(/\s/g, '');
  return compact ? compact.slice(-4) : null;
}
