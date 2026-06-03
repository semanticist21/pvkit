/**
 * 시스템 출력 (PV system output).
 *
 * 설계도: PVWatts DC/AC 모델 (NREL).
 * 입력: POA irradiance, 셀 온도 → DC 출력 → AC 출력.
 * 검증: pvlib `pvsystem.pvwatts_dc` / `inverter.pvwatts` 출력 대조.
 *
 * TODO: pvwatts_dc → pvwatts_ac. high-level ModelChain류는 후순위.
 */

export {};
