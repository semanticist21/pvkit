# @pvkit/core

PV(태양광) 성능 모델링 코어 엔진. 의존성 0, ESM-only, 함수 단위 트리셰이킹.

> 상위 컨텍스트·포지셔닝은 [모노레포 README](../../README.md) 참고.

## 범위 (초기 — 이것만)

| 모듈 | 서브패스 | 설계도(논문) | 검증 레퍼런스(pvlib) |
| --- | --- | --- | --- |
| `solarposition` | `@pvkit/core/solarposition` | NOAA SPA (Reda & Andreas 2004) | `solarposition.spa_python` |
| `irradiance` | `@pvkit/core/irradiance` | Perez 1990 · Hay-Davies · Isotropic | `irradiance.get_total_irradiance` |
| `temperature` | `@pvkit/core/temperature` | SAPM · PVsyst | `temperature.sapm_cell` |
| `pvsystem` | `@pvkit/core/pvsystem` | PVWatts (NREL) | `pvsystem.pvwatts_dc` |

high-level 객체(ModelChain류)는 후순위. low-level 함수부터.

## 검증 철학

논문 = 설계도, pvlib = 정답지. 코드는 베끼지 않는다. pvlib에 같은 입력을
넣어 출력을 fixture로 박제하고, 구현이 그 숫자를 재현하는지 테스트로 검증.
구조·변수명·docstring·매직넘버는 답습하지 않는다 — 막힐 때만 논문 참고.

## 단위 안전

`units.ts`가 브랜디드 `Radians` / `Degrees`를 제공. rad/deg 혼동을 컴파일
타임에 차단하고, 런타임 비용은 0(브랜드는 빌드 시 소거).

```ts
import { radians, toDegrees } from "@pvkit/core";

toDegrees(radians(Math.PI)); // 180
```

## 미정 결정 (구현 전 고정 필요)

1. **네이밍 컨벤션** — `snake_case`(pvlib 친숙) vs `camelCase`(JS 관습).
   _제안: camelCase._ JS 생태계 관습이고, pvlib 함수명은 검증 fixture
   주석에만 등장하면 충분.
2. **시계열 자료구조** — `{t, v}[]` 객체배열(DX 좋음) vs
   `Float64Array + timestamps`(성능/WASM 친화).
   _제안: 코어 계산은 스칼라 in/out으로 두고, 시계열은 얇은 어댑터로 분리._
   스칼라 코어면 두 표현 다 위에 얹을 수 있고, 향후 WASM 경계도 깔끔.

## 개발

```bash
bun install        # 모노레포 루트에서
bun test           # 이 패키지: bun run --filter @pvkit/core test
bun run build      # tsdown → dist (ESM + .d.ts + subpath exports)
```
