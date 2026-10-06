import { expect, test } from "vitest";
import { getNasaPower, NASA_POWER_URL, parseNasaPower } from "./nasa-power.ts";
import fixture from "./nasa-power-fixtures.json" with { type: "json" };
import raw from "./nasa-power-raw.json" with { type: "json" };

const fakeFetch = (body: unknown, status = 200) => {
  const urls: string[] = [];
  const fetch = (async (url: string) => {
    urls.push(url);
    return new Response(JSON.stringify(body), { status });
  }) as typeof globalThis.fetch;
  return { fetch, urls };
};

const parameters = [
  "ghi",
  "dni",
  "dhi",
  "tempAir",
  "windSpeed",
  "relativeHumidity",
  "pressure",
] as const;

test("matches pvlib get_nasa_power: request, rows (incl. leap day), fill → NaN, kPa → Pa", async () => {
  const { fetch, urls } = fakeFetch(raw);
  const got = await getNasaPower({
    latitude: fixture.latitude,
    longitude: fixture.longitude,
    startMs: Date.parse(fixture.start),
    endMs: Date.parse(fixture.end),
    parameters,
    fetch,
  });
  const url = new URL(urls[0] ?? "");
  expect(`${url.origin}${url.pathname}`).toBe(fixture.request.url);
  expect(Object.fromEntries(url.searchParams)).toEqual(fixture.request.params);
  expect(got.meta).toEqual(fixture.meta);
  expect(got.data).toHaveLength(fixture.rows.length);
  got.data.forEach((row, i) => {
    const want = fixture.rows[i] as Record<string, number | null>;
    expect(row.timeMs).toBe(want.timeMs);
    for (const p of parameters) {
      const w = want[p];
      if (w == null) expect(row[p]).toBeNaN();
      // pressure is the only scaled column: kPa * 1000 may differ from numpy in the last ulp
      else expect(row[p]).toBeCloseTo(w, 9);
    }
  });
  expect(got.data.some((r) => Number.isNaN(r.tempAir))).toBe(true);
});

test("default endpoint and parameters are pvlib's", async () => {
  expect(NASA_POWER_URL).toBe(fixture.request.url);
  const { fetch, urls } = fakeFetch(raw);
  await getNasaPower({ latitude: 0, longitude: 0, startMs: 0, endMs: 0, fetch }).catch(() => {});
  expect(new URL(urls[0] ?? "").searchParams.get("parameters")).toBe(
    "ALLSKY_SFC_SW_DNI,ALLSKY_SFC_SW_DIFF,ALLSKY_SFC_SW_DWN,T2M,WS10M",
  );
});

test("optional query fields, errors, missing parameters", async () => {
  const { fetch, urls } = fakeFetch({ messages: ["bad"] }, 422);
  await expect(
    getNasaPower({
      latitude: 0,
      longitude: 0,
      startMs: 0,
      endMs: 0,
      altitude: 12,
      windHeight: 50,
      windSurface: "seaice",
      fetch,
    }),
  ).rejects.toThrow('NASA POWER 422: {"messages":["bad"]}');
  const q = new URL(urls[0] ?? "").searchParams;
  expect([q.get("site-elevation"), q.get("wind-elevation"), q.get("wind-surface")]).toEqual([
    "12",
    "50",
    "seaice",
  ]);
  expect(() => parseNasaPower(raw, ["albedo"])).toThrow("lacks ALLSKY_SRF_ALB");
  expect(() => parseNasaPower({}, ["ghi"])).toThrow("not a NASA POWER");
});
