/** Inputs for {@link poaComponents}. */
export interface PoaComponentsInput {
  /** Angle of incidence, degrees. */
  aoi: number;
  /** Direct normal irradiance, W/m². */
  dni: number;
  /** Sky diffuse in the plane of array, W/m². */
  poaSkyDiffuse: number;
  /** Ground-reflected diffuse in the plane of array, W/m². */
  poaGroundDiffuse: number;
}

/** Plane-of-array irradiance components, W/m². */
export interface PoaComponents {
  /** Direct + diffuse. */
  poaGlobal: number;
  /** Beam on the plane, `max(dni · cos aoi, 0)`. */
  poaDirect: number;
  /** Sky + ground diffuse. */
  poaDiffuse: number;
  poaSkyDiffuse: number;
  poaGroundDiffuse: number;
}

/** Combine beam and diffuse parts into plane-of-array irradiance. */
export const poaComponents = (input: PoaComponentsInput): PoaComponents => {
  const { aoi, dni, poaSkyDiffuse, poaGroundDiffuse } = input;
  const poaDirect = Math.max(dni * Math.cos(aoi * (Math.PI / 180)), 0);
  const poaDiffuse = poaSkyDiffuse + poaGroundDiffuse;
  return {
    poaGlobal: poaDirect + poaDiffuse,
    poaDirect,
    poaDiffuse,
    poaSkyDiffuse,
    poaGroundDiffuse,
  };
};
