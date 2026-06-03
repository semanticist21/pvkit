/**
 * 셀 온도 (cell temperature).
 *
 * 설계도: SAPM (Sandia Array Performance Model) 온도 모델, PVsyst 모델.
 * 입력: POA irradiance, 외기온, 풍속 → 셀 온도.
 * 검증: pvlib `temperature.sapm_cell` / `pvsyst_cell` 출력 대조.
 *
 * TODO: SAPM 먼저(파라미터 테이블 큐레이션), PVsyst 그 다음.
 */

export {};
