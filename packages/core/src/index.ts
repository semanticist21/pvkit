/**
 * @pvkit/core — PV 성능 모델링 코어 엔진.
 *
 * 루트 배럴은 단위 타입과 서브모듈 재export만 제공한다.
 * 트리셰이킹을 위해 실제 사용 시엔 서브패스 import 권장:
 *
 *   import { spa } from "@pvkit/core/solarposition";
 *
 * 보다 루트 배럴 import가 번들에 더 들어갈 수 있다.
 */

export * from "./units.ts";

export * as solarposition from "./solarposition/index.ts";
export * as irradiance from "./irradiance/index.ts";
export * as temperature from "./temperature/index.ts";
export * as pvsystem from "./pvsystem/index.ts";
