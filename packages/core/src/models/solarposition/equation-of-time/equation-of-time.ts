/** Inputs for the equation-of-time helpers. */
export interface EquationOfTimeInput {
  /** Day of year, 1 = 1 January (fractional allowed). */
  dayOfYear: number;
}

/** Day angle `Γ = 2π(n − 1)/365`, radians (Spencer 1971). */
const dayAngle = (dayOfYear: number) => ((2 * Math.PI) / 365) * (dayOfYear - 1);

/**
 * Equation of time, minutes — Spencer (1971) Fourier series (constant 0.0000075 and
 * coefficient 0.040849 per the corrected reprint, as in pvlib).
 *
 * @example equationOfTimeSpencer71({ dayOfYear: 45 }); // ≈ −14.2 min
 */
export const equationOfTimeSpencer71 = ({ dayOfYear }: EquationOfTimeInput): number => {
  const g = dayAngle(dayOfYear);
  return (
    (1440 / (2 * Math.PI)) *
    (0.0000075 +
      0.001868 * Math.cos(g) -
      0.032077 * Math.sin(g) -
      0.014615 * Math.cos(2 * g) -
      0.040849 * Math.sin(2 * g))
  );
};

/**
 * Equation of time, minutes — PVCDROM / Kalogirou (2009):
 * `E = 9.87 sin 2B − 7.53 cos B − 1.5 sin B`, `B = 2π(n − 81)/365`.
 */
export const equationOfTimePvcdrom = ({ dayOfYear }: EquationOfTimeInput): number => {
  const b = dayAngle(dayOfYear) - ((2 * Math.PI) / 365) * 80;
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
};
