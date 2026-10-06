# @pvkit/io — agent notes

Shared rules: `doc/conventions.md` (units, fixtures), `doc/architecture.md` (exports, release).

- Layout: one folder per source under `src/` (`index.ts`, impl, `.md` with `## Reference`,
  test, `<method>-raw.json` captured response, `<method>-fixtures.json`). Public subpath
  `@pvkit/io/<method>`; tsdown generates `exports` — run `pnpm build` and commit
  `package.json` after adding a folder.
- Each source exports `get<Source>` (fetch) and `parse<Source>` (pure). Fixtures come from
  pvlib's own `get_*` with `requests.get` stubbed to return the raw file
  (`scripts/fixtures/io.py`), so the query string is pinned too. Tests never hit the network.
- Query strings copy pvlib's byte for byte (e.g. NASA `header=True`) — a request pvlib
  sends is known to work.
- `fetch` and `signal` are injectable on every getter; no retries, caching or rate limits.
- Deferred: PVGIS hourly series, NSRDB (needs API key), Linke turbidity raster,
  `detect_clearsky`.
