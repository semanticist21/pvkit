import {
  calcparamsDesoto,
  type DesotoConditions,
  type DesotoModule,
  type DiodeParams,
} from "../calcparams-desoto/calcparams-desoto.ts";

/**
 * CEC model (Dobos 2012): De Soto with the short-circuit temperature coefficient scaled by
 * the fit's `adjust`: `αsc,eff = αsc · (1 − adjust/100)`. Pass a `pvkit-js/spec` `CecModule`
 * record directly.
 *
 * @example
 * calcparamsCec({ ...CEC_MODULES[0], effectiveIrradiance: 1000, tempCell: 25 });
 */
export const calcparamsCec = (
  input: DesotoModule &
    DesotoConditions & {
      /** CEC adjustment to `alphaSc`, percent. */
      adjust: number;
    },
): DiodeParams => calcparamsDesoto({ ...input, alphaSc: input.alphaSc * (1 - input.adjust / 100) });
