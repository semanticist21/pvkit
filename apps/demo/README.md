# pvkit demo

Static page that estimates clear-sky annual kWh entirely in the browser with `@pvkit/core`
(`src/estimate.ts` wires the modules). Not published to npm.

Live: https://pvkit.netlify.app — Netlify site `pvkit` (account `semanticist21`), deployed by
hand; no CI deploy.

```bash
pnpm dev     # local server
pnpm build   # static site → dist/ (relative paths; host anywhere)
netlify deploy --prod --no-build --dir dist --site pvkit   # publish (after build)
```
