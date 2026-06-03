/**
 * IAM (incidence angle modifier).
 *
 * Spec: physical (Fresnel/Snell), ASHRAE (b0), Martin-Ruiz (a_r), SAPM
 * polynomial, Marion diffuse integration.
 * Scope: AOI reflection/transmission loss. Closed-form, no data. POA → effective
 * irradiance is incomplete without it.
 * Validation: pin reference outputs as fixtures and assert against them.
 *
 * TODO: physical → ashrae → martin_ruiz → sapm → interp → marion.
 */

export {};
