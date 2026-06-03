/**
 * Tracking (single-axis tracker geometry).
 *
 * Spec: pvlib `tracking.singleaxis` + backtracking; sloped-terrain axis tilt.
 * Scope: pure solar geometry — GCR is a scalar param, not a 3D scene, so this is
 * core, NOT `@pvkit/layout`. High real-world usage (utility-scale PV is
 * overwhelmingly single-axis tracked). Depends only on `solarposition`.
 * Validation: pin reference outputs as fixtures and assert against them.
 *
 * TODO: singleaxis → backtracking → calc_axis_tilt → calc_cross_axis_tilt.
 */

export {};
