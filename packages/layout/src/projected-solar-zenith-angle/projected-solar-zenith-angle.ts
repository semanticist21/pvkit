const D2R = Math.PI / 180;

export interface ProjectedSolarZenithAngleInput {
  solarZenith: number;
  /** Degrees from north, clockwise. */
  solarAzimuth: number;
  /** Tilt of the row/tracker axis from horizontal, degrees. */
  axisTilt: number;
  /** Degrees from north, clockwise. */
  axisAzimuth: number;
}

/**
 * Sun's zenith projected onto the plane perpendicular to a row axis, degrees, signed
 * right-handed about the axis (Anderson & Mikofski 2020, eq. 5). For a horizontal N–S axis
 * this is the ideal tracker rotation.
 *
 * @example projectedSolarZenithAngle({ solarZenith: 45, solarAzimuth: 90, axisTilt: 0, axisAzimuth: 180 }); // −45
 */
export const projectedSolarZenithAngle = ({
  solarZenith,
  solarAzimuth,
  axisTilt,
  axisAzimuth,
}: ProjectedSolarZenithAngleInput): number => {
  const sinZ = Math.sin(solarZenith * D2R);
  const sx = sinZ * Math.sin(solarAzimuth * D2R);
  const sy = sinZ * Math.cos(solarAzimuth * D2R);
  const sz = Math.cos(solarZenith * D2R);
  const cosAa = Math.cos(axisAzimuth * D2R);
  const sinAa = Math.sin(axisAzimuth * D2R);
  const sinAt = Math.sin(axisTilt * D2R);
  const sxP = sx * cosAa - sy * sinAa;
  const szP = sx * sinAa * sinAt + sy * sinAt * cosAa + sz * Math.cos(axisTilt * D2R);
  return Math.atan2(sxP, szP) / D2R;
};
