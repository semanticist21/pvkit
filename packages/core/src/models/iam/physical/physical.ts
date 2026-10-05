import { degrees, toRadians } from "../../../units.ts";

/** Inputs for {@link physical}. */
export interface PhysicalInput {
  /** Angle of incidence between module normal and sun beam, degrees. */
  aoi: number;
  /** Effective refractive index of the cover, unitless. Default 1.526 (glass). */
  n?: number;
  /** Glazing extinction coefficient, 1/m. Default 4 ("water white" glass). */
  k?: number;
  /** Glazing thickness, m. Default 0.002. */
  l?: number;
  /** Refractive index of an anti-reflective coating, unitless. Default: no coating. */
  nAr?: number;
}

/** numpy `isclose(a, b)` defaults: `|a − b| ≤ 1e-8 + 1e-5·|b|`. */
const isClose = (a: number, b: number) => Math.abs(a - b) <= 1e-8 + 1e-5 * Math.abs(b);

/** Fresnel s/p reflectance at one interface: `((x − y) / (x + y))²`. */
const rho = (x: number, y: number) => ((x - y) / (x + y)) ** 2;

/**
 * Physical IAM (De Soto et al. 2006, Duffie & Beckman): Fresnel reflection (mean of s and p
 * polarisation) plus Beer–Lambert absorption in the cover, normalised to normal incidence,
 * with an optional anti-reflective coating layer. 0 for light from behind the plane.
 *
 * @example
 * physical({ aoi: 60 }); // ≈ 0.9302
 */
export const physical = ({ aoi, n = 1.526, k = 4, l = 0.002, nAr }: PhysicalInput): number => {
  const n1 = 1;
  const n3 = n;
  const n2 = nAr === undefined || isClose(nAr, n1) ? n : nAr;

  // Incidence angle; light from behind (aoi > 90) gets cos θ1 = 0 → total reflection.
  let cos = Math.max(0, Math.cos(toRadians(degrees(aoi))));
  let sin = Math.sqrt(1 - cos ** 2);
  const n1cos1 = n1 * cos;
  const n2cos1 = n2 * cos;

  // First interface (air → coating or glass), Snell: sin θ2 = n1/n2 · sin θ1.
  sin = (n1 / n2) * sin;
  cos = Math.sqrt(1 - sin ** 2);
  const n1cos2 = n1 * cos;
  const n2cos2 = n2 * cos;
  const rho12s = rho(n1cos1, n2cos2);
  const rho12p = rho(n1cos2, n2cos1);
  const rho120 = rho(n1, n2);
  let tauS = 1 - rho12s;
  let tauP = 1 - rho12p;
  let tau0 = 1 - rho120;

  if (!isClose(n3, n2)) {
    // AR coating → glass interface, with internal reflections Σ(ρ23ρ12)^i = 1/(1 − ρ23ρ12).
    const n3cos2 = n3 * cos;
    sin = (n2 / n3) * sin;
    cos = Math.sqrt(1 - sin ** 2);
    const n2cos3 = n2 * cos;
    const n3cos3 = n3 * cos;
    const rho23s = rho(n2cos2, n3cos3);
    const rho23p = rho(n2cos3, n3cos2);
    const rho230 = rho(n2, n3);
    tauS *= (1 - rho23s) / (1 - rho23s * rho12s);
    tauP *= (1 - rho23p) / (1 - rho23p * rho12p);
    tau0 *= (1 - rho230) / (1 - rho230 * rho120);
  }

  // Absorption along the refracted path through the glass.
  tauS *= Math.exp((-k * l) / cos);
  tauP *= Math.exp((-k * l) / cos);
  tau0 *= Math.exp(-k * l);

  // With n2 = 1 the Fresnel terms are 0/0 at grazing incidence; pvlib forces aoi ≥ 90 → 0.
  if (isClose(n2, 1) && aoi >= 90) return 0;
  return (tauS + tauP) / 2 / tau0;
};
