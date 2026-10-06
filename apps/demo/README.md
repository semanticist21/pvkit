# pvkit demo

Static page that estimates clear-sky annual kWh entirely in the browser with `pvkit`
(`src/estimate.ts` wires the modules). Not published to npm.

Inputs round-trip through the query string (`?latitude=…&losses=14.1`, field names as in
`index.html`; invalid or missing values fall back to the field defaults), so every result has
a shareable link. The "Code for this result" panel shows `src/estimate.ts` verbatim plus one
`estimate({...})` call with the current inputs (`src/share.ts`), so it can never drift from
what the page runs.

Live: https://pvkit.netlify.app — Netlify site `pvkit` (account `semanticist21`), deployed by
hand; no CI deploy.

```bash
pnpm dev     # local server
pnpm build   # static site → dist/ (relative paths; host anywhere)
netlify deploy --prod --no-build --dir dist --site pvkit   # publish (after build)
```
