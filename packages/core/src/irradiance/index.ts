/**
 * 일사량 (irradiance).
 *
 * 설계도: Perez (1990), Hay-Davies, Isotropic diffuse 모델 + AOI.
 * 범위: GHI → POA 변환, diffuse 성분 모델, 입사각(AOI) 계산.
 * 검증: pvlib `irradiance.get_total_irradiance` / `perez` 출력 대조.
 *
 * TODO: AOI → isotropic → hay-davies → perez 순으로 구현.
 */

export {};
