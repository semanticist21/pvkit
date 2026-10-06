import { expect, test } from "vitest";
import { getPvgisTmy, PVGIS_TMY_URL, parsePvgisTmy } from "./pvgis-tmy.ts";
import fixture from "./pvgis-tmy-fixtures.json" with { type: "json" };
import raw from "./pvgis-tmy-raw.json" with { type: "json" };

const fakeFetch = (body: unknown, status = 200) => {
  const urls: string[] = [];
  const fetch = (async (url: string) => {
    urls.push(url);
    return new Response(JSON.stringify(body), { status });
  }) as typeof globalThis.fetch;
  return { fetch, urls };
};

const toInput = (c: (typeof fixture.cases)[number]["input"]) => {
  const i = c as { usehorizon?: boolean; startyear?: number; endyear?: number };
  return {
    ...(i.usehorizon === undefined ? {} : { useHorizon: i.usehorizon }),
    ...(i.startyear === undefined ? {} : { startYear: i.startyear }),
    ...(i.endyear === undefined ? {} : { endYear: i.endyear }),
  };
};

test.each(fixture.cases)("matches pvlib get_pvgis_tmy: request and rows ($input)", async (c) => {
  const { fetch, urls } = fakeFetch(raw);
  const got = await getPvgisTmy({
    latitude: fixture.latitude,
    longitude: fixture.longitude,
    ...toInput(c.input),
    fetch,
  });
  const url = new URL(urls[0] ?? "");
  expect(`${url.origin}${url.pathname}`).toBe(c.request.url);
  expect(Object.fromEntries(url.searchParams)).toEqual(c.request.params);
  expect(got.data).toEqual(c.rows); // pure parse + rename: exact
  expect(got.meta.monthsSelected).toEqual(c.monthsSelected);
  expect(got.meta).toMatchObject({
    latitude: 37.5665,
    longitude: 126.978,
    altitude: 38,
    irradianceTimeOffset: c.irradianceTimeOffset,
  });
});

test("default endpoint is pvlib's", () => {
  expect(PVGIS_TMY_URL).toBe(fixture.cases[0]?.request.url);
});

test("coerceYear restamps rows; Feb 29 into a non-leap year throws (pvlib raises too)", () => {
  expect(new Date(parsePvgisTmy(raw, 2001).data[0]?.timeMs ?? 0).toISOString()).toBe(
    "2001-01-01T00:00:00.000Z",
  );
  const leap = structuredClone(raw);
  leap.outputs.tmy_hourly = leap.outputs.tmy_hourly
    .slice(0, 1)
    .map((r) => ({ ...r, "time(UTC)": "20200229:1200" }));
  expect(parsePvgisTmy(leap, 2020).data[0]?.timeMs).toBe(Date.UTC(2020, 1, 29, 12));
  expect(() => parsePvgisTmy(leap, 1990)).toThrow(RangeError);
});

test("HTTP errors surface PVGIS's message; non-TMY bodies are rejected", async () => {
  const { fetch } = fakeFetch({ message: "Location over the sea." }, 400);
  await expect(getPvgisTmy({ latitude: 0, longitude: -30, fetch })).rejects.toThrow(
    "PVGIS 400: Location over the sea.",
  );
  expect(() => parsePvgisTmy({ foo: 1 })).toThrow("not a PVGIS TMY");
});
