import { aoi } from "../aoi/aoi.ts";
import { groundDiffuse } from "../ground-diffuse/ground-diffuse.ts";
import { hayDavies } from "../hay-davies/hay-davies.ts";
import { isotropic } from "../isotropic/isotropic.ts";
import { klucher } from "../klucher/klucher.ts";
import { type PerezModel, perez } from "../perez/perez.ts";
import { type PoaComponents, poaComponents } from "../poa-components/poa-components.ts";
import { reindl } from "../reindl/reindl.ts";

interface TotalIrradianceBase {
  /** Panel tilt from horizontal, degrees, [0, 180]. */
  surfaceTilt: number;
  /** Panel azimuth, degrees from north, clockwise. */
  surfaceAzimuth: number;
  /** Solar zenith, degrees. */
  solarZenith: number;
  /** Solar azimuth, degrees. */
  solarAzimuth: number;
  /** Direct normal irradiance, W/m². */
  dni: number;
  /** Global horizontal irradiance, W/m². */
  ghi: number;
  /** Diffuse horizontal irradiance, W/m². */
  dhi: number;
  /** Ground albedo, 0..1. Default 0.25. */
  albedo?: number;
}

/**
 * Inputs for {@link totalIrradiance}. `model` selects the sky diffuse model (default
 * "isotropic"); haydavies/reindl need `dniExtra`, perez also needs `airmassRelative`.
 */
export type TotalIrradianceInput = TotalIrradianceBase &
  (
    | { model?: "isotropic" | "klucher" }
    | { model: "haydavies" | "reindl"; dniExtra: number }
    | {
        model: "perez";
        dniExtra: number;
        /** Relative air mass; NaN (sun below horizon) → zero sky diffuse. */
        airmassRelative: number;
        /** Default "allsitescomposite1990". */
        perezModel?: PerezModel;
      }
  );

const need = (value: number | undefined, name: string, model: string): number => {
  if (value === undefined) throw new RangeError(`${name} is required for model ${model}`);
  return value;
};

/**
 * Plane-of-array irradiance from sun/panel geometry and DNI/GHI/DHI: sky diffuse
 * (selected model) + ground diffuse (albedo) + beam (`dni · cos aoi`), W/m².
 * With `model: "perez"`, dni = dhi = 0 while the sun is up gives NaN (sky clearness 0/0),
 * exactly as pvlib — common at sunrise/sunset in measured data; guard before summing.
 *
 * @example
 * totalIrradiance({ surfaceTilt: 30, surfaceAzimuth: 180, solarZenith: 40,
 *   solarAzimuth: 170, dni: 800, ghi: 750, dhi: 140 });
 */
export const totalIrradiance = (input: TotalIrradianceInput): PoaComponents => {
  const p = input as TotalIrradianceBase & {
    model?: string;
    dniExtra?: number;
    airmassRelative?: number;
    perezModel?: PerezModel;
  };
  const model = p.model ?? "isotropic";
  let poaSkyDiffuse: number;
  if (model === "isotropic") poaSkyDiffuse = isotropic(p);
  else if (model === "klucher") poaSkyDiffuse = klucher(p);
  else if (model === "haydavies") {
    poaSkyDiffuse = hayDavies({ ...p, dniExtra: need(p.dniExtra, "dniExtra", model) });
  } else if (model === "reindl") {
    poaSkyDiffuse = reindl({ ...p, dniExtra: need(p.dniExtra, "dniExtra", model) });
  } else if (model === "perez") {
    poaSkyDiffuse = perez({
      ...p,
      dniExtra: need(p.dniExtra, "dniExtra", model),
      airmassRelative: need(p.airmassRelative, "airmassRelative", model),
      model: p.perezModel ?? "allsitescomposite1990",
    });
  } else throw new RangeError(`unknown sky diffuse model: ${model}`);

  return poaComponents({
    aoi: aoi(p),
    dni: p.dni,
    poaSkyDiffuse,
    poaGroundDiffuse: groundDiffuse(p),
  });
};
