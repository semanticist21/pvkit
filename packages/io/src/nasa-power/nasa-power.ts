/** NASA POWER hourly point endpoint (as pvlib). Sends CORS headers — works from browsers. */
export const NASA_POWER_URL = "https://power.larc.nasa.gov/api/temporal/hourly/point";

/** pvkit field → NASA POWER parameter (pvlib `nasa_power.VARIABLE_MAP`). */
export const NASA_POWER_PARAMETERS = {
  ghi: "ALLSKY_SFC_SW_DWN",
  dhi: "ALLSKY_SFC_SW_DIFF",
  dni: "ALLSKY_SFC_SW_DNI",
  albedo: "ALLSKY_SRF_ALB",
  longwaveDown: "ALLSKY_SFC_LW_DWN",
  dhiClear: "CLRSKY_SFC_SW_DIFF",
  dniClear: "CLRSKY_SFC_SW_DNI",
  ghiClear: "CLRSKY_SFC_SW_DWN",
  pressure: "PS",
  relativeHumidity: "RH2M",
  tempAir: "T2M",
  tempDew: "T2MDEW",
  precipitableWater: "TQV",
  ghiExtra: "TOA_SW_DWN",
  windSpeed2m: "WS2M",
  windSpeed: "WS10M",
} as const;

export type NasaPowerParameter = keyof typeof NASA_POWER_PARAMETERS;

/** pvlib's default set. */
const DEFAULT_PARAMETERS = ["dni", "dhi", "ghi", "tempAir", "windSpeed"] as const;

export interface NasaPowerInput<P extends NasaPowerParameter> {
  /** Degrees, north-positive. */
  latitude: number;
  /** Degrees, east-positive. */
  longitude: number;
  /** First day, UTC epoch ms (only the UTC date is used). */
  startMs: number;
  /** Last day, inclusive, UTC epoch ms (only the UTC date is used). */
  endMs: number;
  /** Default `["dni", "dhi", "ghi", "tempAir", "windSpeed"]`. */
  parameters?: readonly P[];
  /** `re` (renewable energy, default), `sb` (buildings) or `ag` (agroclimatology). */
  community?: "re" | "sb" | "ag";
  /** Site height, m — POWER corrects pressure to it. */
  altitude?: number;
  /** Wind height, m (10–300) for corrected wind speed. */
  windHeight?: number;
  /** POWER wind-surface type alias; pass `altitude` with it. */
  windSurface?: string;
  url?: string;
  fetch?: typeof globalThis.fetch;
  signal?: AbortSignal;
}

/**
 * One hour, interval start. Irradiance is the hour's mean W/m²; `pressure` Pa;
 * `precipitableWater` cm; temperatures °C; wind m/s; `relativeHumidity` %. Fill values → NaN.
 */
export type NasaPowerRecord<P extends NasaPowerParameter> = { timeMs: number } & Record<P, number>;

export interface NasaPower<P extends NasaPowerParameter> {
  data: NasaPowerRecord<P>[];
  /** Grid-cell location POWER answered for; `altitude` m. */
  meta: { latitude: number; longitude: number; altitude: number };
}

interface PowerJson {
  geometry: { coordinates: [number, number, number] };
  header: { fill_value: number };
  properties: { parameter: Record<string, Record<string, number>> };
}

/** Unit conversions pvlib applies when mapping names (kPa → Pa, kg/m² → cm). */
const SCALE: Partial<Record<NasaPowerParameter, number>> = {
  pressure: 1000,
  precipitableWater: 0.1,
};

const ymd = (ms: number) => new Date(ms).toISOString().slice(0, 10).replaceAll("-", "");

/** Parses a NASA POWER hourly JSON response (`time-standard=utc`), as pvlib `get_nasa_power`. */
export const parseNasaPower = <P extends NasaPowerParameter>(
  json: unknown,
  parameters: readonly P[],
): NasaPower<P> => {
  const src = json as PowerJson;
  const series = src?.properties?.parameter;
  if (!series) throw new Error("not a NASA POWER hourly JSON response");
  const fill = src.header.fill_value;
  const columns = parameters.map((p) => {
    const values = series[NASA_POWER_PARAMETERS[p]];
    if (!values) throw new Error(`NASA POWER response lacks ${NASA_POWER_PARAMETERS[p]}`);
    return [p, values, SCALE[p] ?? 1] as const;
  });
  const keys = Object.keys(columns[0]?.[1] ?? {}); // "YYYYMMDDHH", UTC
  const data = keys.map((k) => {
    const row: Record<string, number> = {
      timeMs: Date.UTC(+k.slice(0, 4), +k.slice(4, 6) - 1, +k.slice(6, 8), +k.slice(8, 10)),
    };
    for (const [p, values, scale] of columns) {
      const v = values[k];
      row[p] = v === undefined || v === fill ? Number.NaN : v * scale;
    }
    return row as NasaPowerRecord<P>;
  });
  const [longitude, latitude, altitude] = src.geometry.coordinates;
  return { data, meta: { latitude, longitude, altitude } };
};

/** Fetches hourly irradiance and weather from NASA POWER (satellite + MERRA-2 reanalysis). */
export const getNasaPower = async <
  P extends NasaPowerParameter = (typeof DEFAULT_PARAMETERS)[number],
>(
  input: NasaPowerInput<P>,
): Promise<NasaPower<P>> => {
  const { latitude, longitude, startMs, endMs, community = "re" } = input;
  const { altitude, windHeight, windSurface, url = NASA_POWER_URL, signal } = input;
  const { fetch = globalThis.fetch } = input;
  const parameters = input.parameters ?? (DEFAULT_PARAMETERS as unknown as readonly P[]);
  // Same query as pvlib (including its `header=True`).
  const q = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    start: ymd(startMs),
    end: ymd(endMs),
    community,
    parameters: parameters.map((p) => NASA_POWER_PARAMETERS[p]).join(","),
    format: "json",
    header: "True",
    "time-standard": "utc",
  });
  if (altitude !== undefined) q.set("site-elevation", String(altitude));
  if (windHeight !== undefined) q.set("wind-elevation", String(windHeight));
  if (windSurface !== undefined) q.set("wind-surface", windSurface);
  const res = await fetch(`${url}?${q}`, signal ? { signal } : {});
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok)
    throw new Error(`NASA POWER ${res.status}: ${JSON.stringify(body) ?? res.statusText}`);
  return parseNasaPower(body, parameters);
};
