/**
 * 브랜디드 단위 타입.
 *
 * pvkit의 차별점 중 하나: rad/deg 혼동을 컴파일 타임에 차단한다.
 * 런타임 비용 0 — 빌드 시 브랜드는 지워지고 number만 남는다.
 *
 * @example
 * declare function solarZenith(): Radians;
 * const z = solarZenith();
 * Math.cos(z);        // OK — Radians는 number
 * toDegrees(z);       // OK
 * solarAzimuth(z);    // 타입 에러: Degrees 자리에 Radians
 */

declare const brand: unique symbol;

/** 공칭(nominal) 브랜드 헬퍼. */
type Brand<T, B> = T & { readonly [brand]: B };

/** 라디안 단위 각도. */
export type Radians = Brand<number, "Radians">;

/** 도(degree) 단위 각도. */
export type Degrees = Brand<number, "Degrees">;

const DEG_PER_RAD = 180 / Math.PI;
const RAD_PER_DEG = Math.PI / 180;

/** raw number를 Radians로 태깅 (검증 없음). */
export const radians = (value: number): Radians => value as Radians;

/** raw number를 Degrees로 태깅 (검증 없음). */
export const degrees = (value: number): Degrees => value as Degrees;

/** 라디안 → 도. */
export const toDegrees = (value: Radians): Degrees =>
  (value * DEG_PER_RAD) as Degrees;

/** 도 → 라디안. */
export const toRadians = (value: Degrees): Radians =>
  (value * RAD_PER_DEG) as Radians;
