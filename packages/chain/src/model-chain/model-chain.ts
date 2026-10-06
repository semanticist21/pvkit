import { absoluteAirmass } from "@pvkit/core/atmosphere/absolute-airmass";
import { alt2pres } from "@pvkit/core/atmosphere/altitude-pressure";
import { relativeAirmass } from "@pvkit/core/atmosphere/relative-airmass";
import { ineichen } from "@pvkit/core/clearsky/ineichen";
import { physical } from "@pvkit/core/iam/physical";
import { aoi as angleOfIncidence } from "@pvkit/core/irradiance/aoi";
import { extraRadiation } from "@pvkit/core/irradiance/extra-radiation";
import { totalIrradiance } from "@pvkit/core/irradiance/total-irradiance";
import { pvwattsDc } from "@pvkit/core/pvsystem/pvwatts-dc";
import { pvwattsInverter } from "@pvkit/core/pvsystem/pvwatts-inverter";
import { type PvwattsLossesInput, pvwattsLosses } from "@pvkit/core/pvsystem/pvwatts-losses";
import { spa } from "@pvkit/core/solarposition/spa";
import { SAPM_TEMPERATURE_PARAMETERS, sapmCell } from "@pvkit/core/temperature/sapm";

/** Measured or modelled horizontal irradiance, W/m². */
export interface Weather {
  ghi: number;
  dni: number;
  dhi: number;
}

interface ModelChainBase {
  /** Instant as UTC epoch milliseconds. */
  timeMs: number;
  /** Site latitude, degrees, north-positive. */
  latitude: number;
  /** Site longitude, degrees, east-positive. */
  longitude: number;
  /** Site height above sea level, m. Default 0. */
  altitude?: number;
  /** Panel tilt from horizontal, degrees. */
  surfaceTilt: number;
  /** Panel azimuth, degrees from north, clockwise (south = 180). */
  surfaceAzimuth: number;
  /** Ground albedo, 0..1. Default 0.25. */
  albedo?: number;
  /** Ambient air temperature, °C. Default 20 (pvlib ModelChain default). */
  tempAir?: number;
  /** Wind speed, m/s. Default 0 (pvlib ModelChain default). */
  windSpeed?: number;
  /** Array DC rating at 1000 W/m² and 25 °C, W. */
  pdc0: number;
  /** Temperature coefficient of power, 1/°C (e.g. −0.004). */
  gammaPdc: number;
  /** Inverter DC input limit, W. Default `pdc0 / 1.2 / etaInvNom` (PVWatts DC/AC ratio 1.2). */
  inverterPdc0?: number;
  /** Nominal inverter efficiency. Default 0.96. */
  etaInvNom?: number;
  /** PVWatts loss categories (fractions). Default: PVWatts defaults, ≈ 14.08 % total. */
  losses?: PvwattsLossesInput;
  /** SAPM cell-temperature parameters. Default open rack, glass/glass. */
  temperatureModel?: { a: number; b: number; tempDelta: number };
  /** Sky diffuse transposition model. Default "haydavies" (pvlib ModelChain default). */
  transposition?: "isotropic" | "klucher" | "haydavies" | "reindl" | "perez";
  /** ΔT = TT − UT, seconds. Default 67. */
  deltaT?: number;
}

/**
 * Inputs for {@link modelChain}. Give either measured `weather`, or a `linkeTurbidity` to
 * model the clear sky (Ineichen) instead.
 */
export type ModelChainInput = ModelChainBase &
  ({ weather: Weather; linkeTurbidity?: never } | { weather?: never; linkeTurbidity: number });

/** One instant of {@link modelChain} output. Angles in degrees, irradiance W/m², power W. */
export interface ModelChainResult {
  apparentZenith: number;
  azimuth: number;
  aoi: number;
  ghi: number;
  dni: number;
  dhi: number;
  poaGlobal: number;
  /** POA after the physical IAM (beam only), W/m². */
  effectiveIrradiance: number;
  tempCell: number;
  /** DC power after PVWatts losses, W. */
  pdc: number;
  pac: number;
}

/**
 * pvlib `ModelChain.with_pvwatts` for one instant: SPA sun position → Kasten–Young air mass →
 * (Ineichen clear sky) → transposition → physical IAM → SAPM cell temperature → PVWatts DC →
 * PVWatts losses → PVWatts inverter. Loop it over timestamps and pass `pac` to
 * `energyKwh` for energy. Night steps give 0; with `transposition: "perez"`, measured
 * `dni = dhi = 0` while the sun is up gives NaN, as in pvlib.
 *
 * @example
 * modelChain({ timeMs: Date.UTC(2025, 5, 21, 3), latitude: 37.57, longitude: 126.98,
 *   surfaceTilt: 30, surfaceAzimuth: 180, pdc0: 5000, gammaPdc: -0.004, linkeTurbidity: 3 }).pac;
 */
export const modelChain = (input: ModelChainInput): ModelChainResult => {
  const {
    timeMs,
    latitude,
    longitude,
    altitude = 0,
    surfaceTilt,
    surfaceAzimuth,
    albedo = 0.25,
    tempAir = 20,
    windSpeed = 0,
    pdc0,
    gammaPdc,
    etaInvNom = 0.96,
    inverterPdc0 = pdc0 / 1.2 / etaInvNom,
    losses,
    temperatureModel = SAPM_TEMPERATURE_PARAMETERS.openRackGlassGlass,
    transposition = "haydavies",
    deltaT = 67,
  } = input;
  const pressure = alt2pres({ altitude });
  // ModelChain refracts with the step's air temperature, not SPA's annual-average default.
  const sun = spa({ timeMs, latitude, longitude, altitude, pressure, tempAir, deltaT });
  const airmassRelative = relativeAirmass({ solarZenith: sun.apparentZenith });
  const dniExtra = extraRadiation({ timeMs });
  const sky =
    input.weather ??
    ineichen({
      apparentZenith: sun.apparentZenith,
      airmassAbsolute: absoluteAirmass({ airmassRelative, pressure }),
      linkeTurbidity: input.linkeTurbidity,
      altitude,
      dniExtra,
    });
  const geometry = {
    surfaceTilt,
    surfaceAzimuth,
    solarZenith: sun.apparentZenith,
    solarAzimuth: sun.azimuth,
  };
  const aoi = angleOfIncidence(geometry);
  const poa = totalIrradiance({
    ...geometry,
    ghi: sky.ghi,
    dni: sky.dni,
    dhi: sky.dhi,
    albedo,
    model: transposition,
    dniExtra,
    airmassRelative,
  });
  const effectiveIrradiance = poa.poaDirect * physical({ aoi }) + poa.poaDiffuse;
  const tempCell = sapmCell({ poaGlobal: poa.poaGlobal, tempAir, windSpeed, ...temperatureModel });
  const pdc =
    pvwattsDc({ effectiveIrradiance, tempCell, pdc0, gammaPdc }) * (1 - pvwattsLosses(losses));
  return {
    apparentZenith: sun.apparentZenith,
    azimuth: sun.azimuth,
    aoi,
    ghi: sky.ghi,
    dni: sky.dni,
    dhi: sky.dhi,
    poaGlobal: poa.poaGlobal,
    effectiveIrradiance,
    tempCell,
    pdc,
    pac: pvwattsInverter({ pdc, pdc0: inverterPdc0, etaInvNom }),
  };
};
