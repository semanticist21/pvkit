# pvkit

태양광(PV) 성능 모델링을 위한 모던 TypeScript/ESM 라이브러리 모노레포.

Python의 `pvlib`가 독점하는 영역을, 같은 공개 논문(NOAA SPA, Perez,
Hay-Davies, SAPM, PVWatts 등)을 보고 **독립 구현**하여 JS가 도는 모든
곳(브라우저 · 엣지 · Worker · React Native)으로 가져온다.

## 포지셔닝

"더 똑똑한 PV 과학"이 아니라 **"JS가 도는 모든 곳으로"**. pvlib가 못 하는 것:

- 브라우저/엣지/Worker/RN에서 직접 계산 (백엔드 왕복 불필요)
- 타입·단위 안전 (브랜디드 타입으로 rad/deg 혼동을 컴파일 타임에 차단)
- 트리셰이킹·작은 번들 (함수 단위 import)
- 시점/스트림 단위 계산 (배치 DataFrame 아님 → 실시간 친화)
- 큐레이션: pvlib 100+ 모델 대신 검증된 best-practice 한 길만

## 검증 철학

- **논문 = 설계도. pvlib = 정답지(검증용 레퍼런스).** 코드는 베끼지 않는다.
- pvlib에 같은 입력을 넣어 출력값을 fixture로 박제하고, 구현이 그 숫자를
  재현하는지 테스트로 검증한다. (출력 대조는 합법·정상)
- 알고리즘은 공개 과학이라 라이선스 의무 없음. API는 자유롭게 설계.

## 패키지

| 패키지 | 상태 | 설명 |
| --- | --- | --- |
| [`@pvkit/core`](packages/core) | 🚧 작업 중 | PV 모델링 코어 엔진 (solarposition · irradiance · temperature · pvsystem) |
| `@pvkit/react` | 📋 계획 | 실시간 React 훅 |
| `@pvkit/sizer` | 📋 계획 | 스트링 사이징 — 패널 직렬/병렬 구성 검증 (인버터 과전압 안전) |

## 기술 방향

- **ESM-only.** CJS 안 만든다. 타깃은 모던 번들러 환경(Vite/Next 등).
- 극단적 tree-shaking. `"sideEffects": false`, 함수형 export.
- 의존성 0 지향. 순수 TS.
- 빌드: rolldown 기반 `tsdown`. ESM + `.d.ts` + exports map(subpath).
- 무거운 시계열 수치 루프(SPA 등)는 나중에 WASM(Rust) 옵트인 가속
  서브패스로 분리. 1.0은 순수 JS로 먼저.

## 개발

```bash
bun install
bun run build
bun run test
```
