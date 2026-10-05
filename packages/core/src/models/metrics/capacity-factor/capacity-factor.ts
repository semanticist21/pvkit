import { compensatedSum } from "../../../sum.ts";

/**
 * Capacity factor `CF = ΣE / (P_nameplate · hours)`, a fraction (Marion et al. 2005).
 * The nameplate basis (AC or DC) is the caller's choice; state it when reporting.
 *
 * @example
 * capacityFactor({ energy: [8760], nameplate: 5, hours: 8760 }); // 0.2
 */
export const capacityFactor = (input: {
  /** Delivered energy per interval, kWh (a one-element total is fine). */
  energy: ArrayLike<number>;
  /** Nameplate power, kW (AC or DC), > 0. */
  nameplate: number;
  /** Length of the period, hours, > 0 (8760 for a non-leap year). */
  hours: number;
}): number => {
  const { energy, nameplate, hours } = input;
  if (!(nameplate > 0 && Number.isFinite(nameplate))) {
    throw new RangeError(`nameplate must be finite and > 0, got ${nameplate}`);
  }
  if (!(hours > 0 && Number.isFinite(hours))) {
    throw new RangeError(`hours must be finite and > 0, got ${hours}`);
  }
  return compensatedSum(energy) / (nameplate * hours);
};
