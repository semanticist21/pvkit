import { expect, test } from "vitest";
import {
  getNasaPower,
  NASA_POWER_PARAMETERS,
  NASA_POWER_URL,
  type NasaPowerParameter,
  parseNasaPower,
} from "./nasa-power.ts";
import fixture from "./nasa-power-fixtures.json" with { type: "json" };
import raw from "./nasa-power-raw.json" with { type: "json" };

const fakeFetch = (body: string, status = 200) => {
  const urls: string[] = [];
  const fetch = (async (url: string) => {
    urls.push(url);
    return new Response(body, { status, statusText: status === 503 ? "Service Unavailable" : "" });
  }) as typeof globalThis.fetch;
  return { fetch, urls };
};

test("name map is pvlib VARIABLE_MAP; endpoint is pvlib URL", () => {
  expect(NASA_POWER_PARAMETERS).toEqual(fixture.variableMap);
  expect(NASA_POWER_URL).toBe(fixture.cases[0]?.request.url);
});

test.each(fixture.cases)("matches pvlib get_nasa_power: request and rows ($input)", async (c) => {
  const { fetch, urls } = fakeFetch(JSON.stringify(raw));
  const { parameters, ...rest } = c.input as { parameters: NasaPowerParameter[] };
  const isDefault = parameters.join() === fixture.defaultParameters.join();
  const got = await getNasaPower({
    latitude: fixture.latitude,
    longitude: fixture.longitude,
    startMs: Date.parse(fixture.start),
    endMs: Date.parse(fixture.end),
    ...(isDefault ? {} : { parameters }), // the default case omits `parameters`
    ...rest,
    fetch,
  });
  const url = new URL(urls[0] ?? "");
  expect(`${url.origin}${url.pathname}`).toBe(c.request.url);
  expect(Object.fromEntries(url.searchParams)).toEqual(c.request.params);
  expect(got.meta).toEqual(fixture.meta);
  // fill → NaN (fixture null); kPa → Pa and TQV ÷ 10 are pvlib's exact operations
  const nan = (r: object) =>
    Object.fromEntries(Object.entries(r).map(([k, v]) => [k, Number.isNaN(v) ? null : v]));
  expect(got.data.map(nan)).toEqual(c.rows);
});

test("fill values, leap day, precipitable water are covered by the fixture", () => {
  const rows = (fixture.cases[0]?.rows ?? []) as Record<string, number | null>[];
  expect(rows.some((r) => r.tempAir === null)).toBe(true);
  expect(rows.some((r) => r.timeMs === Date.UTC(2024, 1, 29, 0))).toBe(true);
  expect(rows.every((r) => typeof r.precipitableWater === "number")).toBe(true);
});

test("errors, missing parameters", async () => {
  await expect(
    getNasaPower({
      latitude: 0,
      longitude: 0,
      startMs: 0,
      endMs: 0,
      fetch: fakeFetch('{"messages":["bad"]}', 422).fetch,
    }),
  ).rejects.toThrow('NASA POWER 422: {"messages":["bad"]}');
  await expect(
    getNasaPower({
      latitude: 0,
      longitude: 0,
      startMs: 0,
      endMs: 0,
      fetch: fakeFetch("<html>Bad gateway</html>", 503).fetch,
    }),
  ).rejects.toThrow("NASA POWER 503: Service Unavailable");
  const partial = structuredClone(raw) as { properties: { parameter: Record<string, unknown> } };
  delete partial.properties.parameter.ALLSKY_SRF_ALB;
  expect(() => parseNasaPower(partial, ["albedo"])).toThrow("lacks ALLSKY_SRF_ALB");
  expect(() => parseNasaPower({}, ["ghi"])).toThrow("not a NASA POWER");
});
