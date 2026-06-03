/**
 * Decomposition (GHI → DNI/DHI splitters).
 *
 * Spec: Erbs (1982), Boland, DISC (Maxwell 1987), DIRINT, DIRINDEX.
 * Scope: essential because real weather feeds (TMY, satellite, most APIs) often
 * deliver GHI only — without a splitter the transposition→kWh chain has no beam
 * component. DIRINT needs a 3-hour stability window → time-series adapter.
 * Validation: pin reference outputs as fixtures and assert against them.
 *
 * TODO: complete_irradiance → erbs → boland → disc → dirint → dirindex.
 * gti_dirint (iterative inverse transposition) deferred to v2.
 */

export {};
