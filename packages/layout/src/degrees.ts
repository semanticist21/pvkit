declare const unit: unique symbol;

/**
 * Angle in degrees, a nominal brand over `number` (erased at build). Same role as
 * `@pvkit/core`'s `Degrees`, declared here so the package keeps zero dependencies; it is a
 * distinct type, so re-tag with core's `degrees()` where a core `Degrees` is required.
 */
export type Degrees = number & { readonly [unit]: "Degrees" };
