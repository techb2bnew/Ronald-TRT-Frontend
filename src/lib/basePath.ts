/**
 * The admin app's own /api/* routes (src/pages/api/*) are Pages Router routes,
 * independent of where the app-router pages live under src/app/admin/* — so
 * they stay unprefixed at the domain root regardless of the /admin page nesting.
 * Kept as a named constant (rather than reverting every call site) so it stays
 * a single flip if that ever needs to change again.
 */
export const BASE_PATH = '';
