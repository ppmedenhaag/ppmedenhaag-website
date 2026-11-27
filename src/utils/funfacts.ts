/** Whole years from `since` until `now` (Europe/Amsterdam calendar is close enough at year granularity). */
export function yearsSince(since: Date, now = new Date()): number {
  let years = now.getUTCFullYear() - since.getUTCFullYear();
  const beforeAnniversary =
    now.getUTCMonth() < since.getUTCMonth() ||
    (now.getUTCMonth() === since.getUTCMonth() && now.getUTCDate() < since.getUTCDate());
  if (beforeAnniversary) years--;
  return years;
}

/** The number shown for an About-page fun fact: `since` (computed at build time) wins over a fixed `count`. */
export function funfactValue(item: { count?: string; since?: Date }): string {
  return item.since ? String(yearsSince(item.since)) : (item.count ?? "");
}
