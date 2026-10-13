# AGENTS.md — Tools (`tools.tommyfx.pk`)

## Mission

Build a free, browser-first utility site for organic search and later AdSense.  
Work only from assigned tickets under `docs/epics/`.

## Mandatory reads

- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`
- `docs/SEO.md`
- `docs/DESIGN.md`
- `docs/QA.md`
- Active epic file in `docs/epics/`

SOP reference: `docs/website-idea.extracted.txt`

## Hard DO NOT

- Paid AI APIs for core tools
- User accounts, database, Python backend, cloud file storage (v1)
- Claim “processed locally” unless true
- Log file contents or sensitive inputs to analytics
- Thin/duplicate SEO pages
- Commit/push unless the operator explicitly asks
- Implement more than the assigned ticket

## Hard DO

- Pure logic in `src/lib/tools/<id>/` with tests
- React only as islands for interactivity
- Tool pages via shared tool layout + SEO structure
- Small patches; keep PRs/tickets reviewable
- Run `npm test` (when present), `npx astro check`, `npm run build` before done

## Dev server

```sh
cd /Users/dev/Documents/self/website/tools
npm run dev
```

Default: http://localhost:4321
