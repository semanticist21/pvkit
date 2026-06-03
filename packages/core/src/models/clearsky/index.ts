/**
 * Clear-sky irradiance.
 *
 * Spec: Haurwitz (1945), Ineichen-Perez (2002), simplified Solis (Ineichen 2008);
 * air mass Kasten-Young (1989).
 * Scope: GHI/DNI/DHI under cloudless sky from sun position alone — the fallback
 * input when no measured weather data is fetched. Depends only on `solarposition`.
 * Validation: pin reference outputs as fixtures and assert against them.
 *
 * TODO: implement in order air-mass → Haurwitz → Ineichen → Solis.
 */

export {};
