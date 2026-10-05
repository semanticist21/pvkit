import { type DirintInput, type DirintNeighbor, dirint } from "../dirint/dirint.ts";

/** A neighbouring sample for the ΔKt' stability index, with its clear-sky GHI. */
export interface DirindexNeighbor extends DirintNeighbor {
  /** Clear-sky GHI at that step, W/m². */
  ghiClearsky: number;
}

/** Inputs for {@link dirindex}. Same as DIRINT plus clear-sky GHI/DNI. */
export interface DirindexInput extends Omit<DirintInput, "previous" | "next"> {
  /** Clear-sky GHI, W/m². */
  ghiClearsky: number;
  /** Clear-sky DNI, W/m². */
  dniClearsky: number;
  /** Previous timestep; omit at the start of a series. */
  previous?: DirindexNeighbor | undefined;
  /** Next timestep; omit at the end of a series. */
  next?: DirindexNeighbor | undefined;
}

const clearNeighbor = (nb: DirindexNeighbor | undefined): DirintNeighbor | undefined =>
  nb && { ...nb, ghi: nb.ghiClearsky };

/**
 * DIRINDEX (Perez et al. 2002): `DNI = dniClearsky · DIRINT(ghi) / DIRINT(ghiClearsky)`,
 * negative results set to 0 (pvlib `irradiance.dirindex`, one instant). NaN wherever
 * DIRINT is NaN or both DIRINT terms are 0 (e.g. night, zenith > `maxZenith`).
 *
 * @returns DNI, W/m².
 */
export const dirindex = (input: DirindexInput): number => {
  const { ghiClearsky, dniClearsky, previous, next, ...common } = input;
  const dni = dirint({ ...common, previous, next });
  const dniClear = dirint({
    ...common,
    ghi: ghiClearsky,
    previous: clearNeighbor(previous),
    next: clearNeighbor(next),
  });
  const out = (dniClearsky * dni) / dniClear;
  return out < 0 ? 0 : out;
};
