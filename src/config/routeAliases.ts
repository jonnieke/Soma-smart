/**
 * Friendly and legacy URLs that resolve to the three learner doors
 * (Homework, Revision, Past papers) or to the free pool.
 *
 * These exist so shared links, ads and WhatsApp messages keep working and so
 * every learner journey has exactly one canonical URL. Query strings are
 * preserved by `RedirectKeepQuery` (e.g. `/learner-pool?grade=Form%204`).
 *
 * NOTE: `/revision/dashboard` is intentionally NOT an alias. It is the
 * access-checked paper runner linked from the paper bank, library and
 * unfinished-attempt cards.
 */
export const ROUTE_ALIASES: Readonly<Record<string, string>> = {
  '/learner-pool': '/free-pool',
  '/pool': '/free-pool',
  '/homework': '/',
  '/revise': '/revision',
  '/papers': '/exam-papers',
  '/past-papers': '/exam-papers',
};
