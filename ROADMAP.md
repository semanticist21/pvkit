# pvkit 로드맵

> 상태: 검토 중(후보). 확정 아님. `@pvkit/core` scaffold 완료(틀만, PV 모델 stub).

## 확정

| 패키지 | 상태 | 설명 |
| --- | --- | --- |
| `@pvkit/core` | 🚧 scaffold 완료 | PV 모델링 코어. solarposition · irradiance · temperature · pvsystem. kWh 산출. |
| `@pvkit/sizer` | 📋 계획 | 스트링 사이징. 패널 직렬/병렬 구성 계산. 인버터 과전압 안전 직결, JS 도구 공백. |

## 검토 중 (react 대신 고려)

`@pvkit/react`(실시간 훅)는 우선순위에서 내림 — 아래가 프론트 유용성·차별화 모두 강함.

### 1순위 — `@pvkit/economics` (재무 모델링) ★ 유력

태양광 견적 계산기 = 솔라 웹앱 1등 유형인데 JS 라이브러리 부재.

- LCOE(균등화발전원가), 투자회수기간(payback), ROI
- 25년 발전량 + 연 열화율(degradation) 누적
- 전기요금 절감액, 자가소비 vs 매전, 인센티브 반영
- 순수 계산 → 브라우저서 바로 돎 (견적 페이지 = 클라 계산이 자연스러움)
- `core`(kWh) → `economics`($)로 완벽히 물림

→ react보다 프론트 유용. 견적 계산기는 클라서 돌아야 UX 좋음. 차별화 강함(빈 땅).

### 2순위 — `@pvkit/io` (기상/일사 데이터)

pvlib `iotools` 대응. PVGIS · NASA POWER · NSRDB 등서 TMY·기상 데이터 fetch.

- 진짜 빈 땅, 수요 확실 (모델링하려면 기상 데이터부터 필요)
- 단점: 브라우저 CORS·API키 문제로 서버 성격 강함 → "프론트 유용"엔 살짝 안 맞음

### 3순위 — `@pvkit/layout` (배치/음영)

지붕 면적 → 패널 수, 틸트/방위 최적화, 음영·지평선 분석.

- 시각적 → 프론트 잘 맞음
- 단점: 3D·기하 무거움. 구현 난이도 높고 1.0 부담

### 4순위 — `@pvkit/spec` (datasheet 파서/DB)

패널·인버터 스펙 정규화. `sizer`가 이걸 소비.

- 유용하나 데이터 큐레이션 노가다. 라이브러리보다 데이터셋 성격

## 의존 그래프 (예상)

```
core (kWh) ──┬─► economics ($)
             ├─► layout
             └─► sizer ◄── spec
io ──► core (입력 데이터 공급)
```
