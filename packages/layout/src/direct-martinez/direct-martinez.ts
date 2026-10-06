export interface DirectMartinezInput {
  /** Unshaded plane-of-array global, W/m². */
  poaGlobal: number;
  /** Unshaded plane-of-array direct, W/m². */
  poaDirect: number;
  /** Shaded fraction of the array, 0–1 (e.g. from shadedFraction1d). */
  shadedFraction: number;
  /** Bypass-diode blocks with any shade (fractional values are rounded up). */
  shadedBlocks: number;
  /** Bypass-diode blocks in the string. */
  totalBlocks: number;
}

/**
 * Relative power loss 0–1 of a partially shaded c-Si array (Martínez-Moreno, Muñoz & Lorenzo
 * 2010, eq. 2): shade on one cell drops its whole bypass-diode block.
 *
 * @example directMartinez({ poaGlobal: 1000, poaDirect: 800, shadedFraction: 0.1, shadedBlocks: 1, totalBlocks: 3 }); // ≈ 0.26
 */
export const directMartinez = ({
  poaGlobal,
  poaDirect,
  shadedFraction,
  shadedBlocks,
  totalBlocks,
}: DirectMartinezInput): number => {
  const beam = (1 - shadedFraction) * (1 - Math.ceil(shadedBlocks) / (1 + totalBlocks));
  return 1 - (poaDirect * beam + (poaGlobal - poaDirect)) / poaGlobal;
};
