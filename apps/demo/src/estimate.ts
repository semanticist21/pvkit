import { absoluteAirmass } from "@pvkit/core/atmosphere/absolute-airmass";
import { alt2pres } from "@pvkit/core/atmosphere/altitude-pressure";
import { relativeAirmass } from "@pvkit/core/atmosphere/relative-airmass";
import { ineichen } from "@pvkit/core/clearsky/ineichen";
import { extraRadiation } from "@pvkit/core/irradiance/extra-radiation";
import { totalIrradiance } from "@pvkit/core/irradiance/total-irradiance";
import { energyKwh } from "@pvkit/core/pvsystem/energy-kwh";
import { pvwattsDc } from "@pvkit/core/pvsystem/pvwatts-dc";
import { pvwattsInverter } from "@pvkit/core/pvsystem/pvwatts-inverter";
import { spa } from "@pvkit/core/solarposition/spa";
import { SAPM_TEMPERATURE_PARAMETERS, sapmCell } from "@pvkit/core/temperature/sapm";

export interface EstimateInput {
  latitude: number;
  longitude: number;
  /** m above sea level. */
  altitude: number;
  /** Degrees from horizontal. */
  tilt: number;
  /** Degrees clockwise from north (180 = south). */
  azimuth: number;
  /** Array DC nameplate, kW. */
  dcKw: number;
  /** System losses, fraction 0–1 (PVWatts default ≈ 0.14). */
  losses: number;
  linkeTurbidity: number;
  /** Ambient temperature, °C (constant — no weather data). */
  tempAir: number;
}

export interface Estimate {
  /** AC kWh per calendar month, Jan–Dec, in local standard time (UTC + round(longitude/15) h). */
  monthlyKwh: number[];
  annualKwh: number;
  /** kWh per kWp per year. */
  specificYield: number;
}

const YEAR = 2025; // any non-leap year; clear sky barely varies year to year
const HOUR = 3_600_000;
const DC_AC = 1.2; // array DC nameplate / inverter AC nameplate (PVWatts default)
const ETA_INV_NOM = 0.96; // pvwattsInverter's default nominal efficiency

/**
 * Clear-sky annual AC energy: hourly SPA → Ineichen → Perez POA → SAPM cell temp →
 * PVWatts DC/losses/inverter (DC:AC 1.2 against the inverter AC nameplate). An upper bound —
 * real weather lowers it.
 */
export const estimate = (input: EstimateInput): Estimate => {
  const { latitude, longitude, altitude, tilt, azimuth, dcKw, losses, linkeTurbidity, tempAir } =
    input;
  const pdc0 = dcKw * 1000;
  // Inverter DC input limit: its AC ceiling ηnom·limit equals the AC nameplate pdc0 / DC_AC.
  const inverterPdc0 = pdc0 / DC_AC / ETA_INV_NOM;
  const pressure = alt2pres({ altitude });
  // Month bounds in local standard time, approximated from longitude (no timezone database).
  const utcOffset = Math.round(longitude / 15) * HOUR;
  const monthlyKwh = Array.from({ length: 12 }, (_, m) => {
    const start = Date.UTC(YEAR, m, 1) - utcOffset;
    const end = Date.UTC(YEAR, m + 1, 1) - utcOffset;
    const power: number[] = [];
    // Mid-hour samples represent each hour.
    for (let t = start + HOUR / 2; t < end; t += HOUR) {
      const sun = spa({ timeMs: t, latitude, longitude, altitude });
      if (!(sun.apparentZenith < 90)) continue;
      const airmassRelative = relativeAirmass({ solarZenith: sun.apparentZenith });
      const dniExtra = extraRadiation({ timeMs: t });
      const sky = ineichen({
        apparentZenith: sun.apparentZenith,
        airmassAbsolute: absoluteAirmass({ airmassRelative, pressure }),
        linkeTurbidity,
        altitude,
        dniExtra,
      });
      const poa = totalIrradiance({
        surfaceTilt: tilt,
        surfaceAzimuth: azimuth,
        solarZenith: sun.apparentZenith,
        solarAzimuth: sun.azimuth,
        ...sky,
        model: "perez",
        dniExtra,
        airmassRelative,
      }).poaGlobal;
      if (!(poa > 0)) continue; // NaN (Perez at dni = dhi = 0) or sun behind the array
      const tempCell = sapmCell({
        poaGlobal: poa,
        tempAir,
        windSpeed: 1,
        ...SAPM_TEMPERATURE_PARAMETERS.openRackGlassPolymer,
      });
      const pdc = pvwattsDc({ effectiveIrradiance: poa, tempCell, pdc0, gammaPdc: -0.0037 });
      power.push(
        pvwattsInverter({
          pdc: pdc * (1 - losses),
          pdc0: inverterPdc0,
          etaInvNom: ETA_INV_NOM,
        }),
      );
    }
    return energyKwh({ power, stepHours: 1 });
  });
  const annualKwh = monthlyKwh.reduce((a, b) => a + b, 0);
  return { monthlyKwh, annualKwh, specificYield: dcKw > 0 ? annualKwh / dcKw : 0 };
};
