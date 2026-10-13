# Tools (`tools.tommyfx.pk`)

Free browser-based utility platform (Astro + TypeScript + Tailwind + React islands).  
Hosted later on Cloudflare Pages. Parent domain: `tommyfx.pk`.

## Requirements

- Node.js `>= 22.12` (this machine has Node via `fnm`)
- npm (comes with Node)

If Node is missing in a new terminal:

```sh
eval "$(fnm env)"
fnm use 24
```

## Setup (already done once)

```sh
cd /Users/dev/Documents/self/website/tools
npm install
```

## Daily commands

```sh
cd /Users/dev/Documents/self/website/tools

npm run dev        # local site → http://localhost:4321
npm run build      # production build → ./dist
npm run preview    # preview production build
npx astro check    # TypeScript / Astro checks
```

## Stack

| Piece | Choice |
| --- | --- |
| Framework | Astro 7 |
| Language | TypeScript (strict) |
| Styles | Tailwind CSS 4 |
| Interactive tools | React islands (`client:*`) |
| Deploy target | Cloudflare Pages (static) |
| Canonical site | `https://tools.tommyfx.pk` |

## Project layout

```text
tools/
├── public/           # static assets
├── src/
│   ├── components/
│   ├── layouts/
│   ├── pages/        # routes
│   └── styles/
├── astro.config.mjs
└── package.json
```

## DNS (when you deploy)

Create a Cloudflare DNS CNAME (or Pages custom domain):

- `tools.tommyfx.pk` → your Cloudflare Pages project

Do not use `aitools` as the primary brand: most tools are not AI (hours, image, PDF, finance). Keep AI tools as a category under `tools`.
