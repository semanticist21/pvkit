/**
 * 태양 위치 (solar position).
 *
 * 설계도: NOAA SPA (Reda & Andreas, 2004) — zenith / azimuth / elevation.
 * 검증: pvlib `solarposition.spa_python` 출력값을 fixture로 박제해 대조.
 *
 * TODO: SPA 구현. 시점 단위 계산(스칼라 in/out)으로 먼저, 시계열 배치는 그 위에.
 * 무거운 수치 루프는 1.0 이후 WASM 옵트인 가속으로 분리.
 */

export {};
