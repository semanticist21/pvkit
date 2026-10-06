/**
 * @pvkit/economics — PV project finance on plain numbers: lifetime energy with degradation,
 * bill savings (self-consumption vs export), cash flows, NPV, IRR, payback, ROI, LCOE.
 * Each method is also its own subpath (`@pvkit/economics/<method>`).
 */

export * from "./bill-savings/index.ts";
export * from "./cash-flows/index.ts";
export * from "./irr/index.ts";
export * from "./lcoe/index.ts";
export * from "./lifetime-energy/index.ts";
export * from "./npv/index.ts";
export * from "./payback-period/index.ts";
export * from "./roi/index.ts";
