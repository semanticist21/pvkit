/** PVGIS TMY endpoint (pvlib's default; unversioned → PVGIS's current API). */
export const PVGIS_TMY_URL = "https://re.jrc.ec.europa.eu/api/tmy";

export interface PvgisTmyInput {
  /** Degrees, north-positive. */
  latitude: number;
  /** Degrees, east-positive. */
  longitude: number;
  /** Include terrain-horizon shading in the irradiance. Default true (PVGIS default). */
  usehorizon?: boolean;
  /** First / last year the TMY months are drawn from. Default: PVGIS's full range. */
  startYear?: number;
  endYear?: number;
  /**
   * Year stamped on every row (TMY months come from different years). Default 1990, as
   * pvlib. Must not be a leap year unless the data has no Feb 29.
   */
  coerceYear?: number;
  /**
   * Endpoint. PVGIS sends no CORS headers, so browsers must point this at a proxy that
   * forwards the query string to {@link PVGIS_TMY_URL}.
   */
  url?: string;
  fetch?: typeof globalThis.fetch;
  signal?: AbortSignal;
}

export interface PvgisTmyRecord {
  /** UTC epoch ms, hour start, year replaced by `coerceYear`. */
  timeMs: number;
  /** W/m². */
  ghi: number;
  dni: number;
  dhi: number;
  /** Downwelling longwave (thermal infrared) on the horizontal, W/m². */
  longwaveDown: number;
  /** °C at 2 m. */
  tempAir: number;
  /** %. */
  relativeHumidity: number;
  /** m/s at 10 m. */
  windSpeed: number;
  /** Degrees from north, clockwise. */
  windDirection: number;
  /** Pa. */
  pressure: number;
}

export interface PvgisTmy {
  data: PvgisTmyRecord[];
  meta: {
    latitude: number;
    longitude: number;
    /** Site height, m. */
    altitude: number;
    /** Source year of each calendar month. */
    monthsSelected: { month: number; year: number }[];
    /** PVGIS `inputs.meteo_data` (databases, year range, horizon source), as sent. */
    meteoData: Record<string, unknown>;
  };
}

interface PvgisJson {
  inputs: {
    location: { latitude: number; longitude: number; elevation: number };
    meteo_data: Record<string, unknown>;
  };
  outputs: {
    months_selected: { month: number; year: number }[];
    tmy_hourly: Record<string, number | string>[];
  };
}

/**
 * Parses a PVGIS TMY JSON response (`outputformat=json`), mapping columns to pvkit names and
 * stamping every row with `coerceYear` (pvlib `get_pvgis_tmy` with default arguments).
 */
export const parsePvgisTmy = (json: unknown, coerceYear = 1990): PvgisTmy => {
  const src = json as PvgisJson;
  if (!Array.isArray(src?.outputs?.tmy_hourly)) throw new Error("not a PVGIS TMY JSON response");
  const data = src.outputs.tmy_hourly.map((r) => {
    // "YYYYMMDD:HHMM", UTC
    const t = String(r["time(UTC)"]);
    const month = Number(t.slice(4, 6));
    const day = Number(t.slice(6, 8));
    const timeMs = Date.UTC(
      coerceYear,
      month - 1,
      day,
      Number(t.slice(9, 11)),
      Number(t.slice(11, 13)),
    );
    if (new Date(timeMs).getUTCDate() !== day) {
      throw new RangeError(`${t} does not exist in coerceYear ${coerceYear}`);
    }
    return {
      timeMs,
      ghi: Number(r["G(h)"]),
      dni: Number(r["Gb(n)"]),
      dhi: Number(r["Gd(h)"]),
      longwaveDown: Number(r["IR(h)"]),
      tempAir: Number(r.T2m),
      relativeHumidity: Number(r.RH),
      windSpeed: Number(r.WS10m),
      windDirection: Number(r.WD10m),
      pressure: Number(r.SP),
    };
  });
  const { latitude, longitude, elevation } = src.inputs.location;
  return {
    data,
    meta: {
      latitude,
      longitude,
      altitude: elevation,
      monthsSelected: src.outputs.months_selected,
      meteoData: src.inputs.meteo_data,
    },
  };
};

/** Fetches a typical meteorological year (8760 hourly rows) from PVGIS. */
export const getPvgisTmy = async (input: PvgisTmyInput): Promise<PvgisTmy> => {
  const { latitude, longitude, usehorizon = true, startYear, endYear, coerceYear } = input;
  const { url = PVGIS_TMY_URL, fetch = globalThis.fetch, signal } = input;
  const q = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    outputformat: "json",
  });
  if (!usehorizon) q.set("usehorizon", "0"); // PVGIS default is 1
  if (startYear !== undefined) q.set("startyear", String(startYear));
  if (endYear !== undefined) q.set("endyear", String(endYear));
  const res = await fetch(`${url}?${q}`, signal ? { signal } : {});
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    // PVGIS explains 400s as {"message": "..."}.
    const message = (body as { message?: unknown } | null)?.message;
    throw new Error(
      `PVGIS ${res.status}: ${typeof message === "string" ? message : res.statusText}`,
    );
  }
  return parsePvgisTmy(body, coerceYear);
};
