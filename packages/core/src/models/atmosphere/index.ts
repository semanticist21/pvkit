/**
 * Atmosphere.
 *
 * Spec: Kasten-Young (1989) air mass; Gueymard (1994) precipitable water;
 * barometric altitude relation. Linke turbidity / AOD Angstrom helpers.
 * Scope: dataless closed-form helpers consumed by `clearsky` and `irradiance`.
 * Air mass lives here (moved out of clearsky/irradiance). Caller supplies
 * turbidity / AOD; no bundled climatology raster (that is `@pvkit/io`).
 * Validation: pin reference outputs as fixtures and assert against them.
 *
 * TODO: relative air mass → absolute (pressure-corrected) → alt2pres/pres2alt →
 * precipitable water → Linke/AOD helpers.
 */

export {};
