# pdf-lib (client PDF dependency)

| Item                       | Value                                                                                                                                                                             |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package                    | `pdf-lib`                                                                                                                                                                         |
| Version                    | see `package.json` (installed as `^1.17.1`)                                                                                                                                       |
| License                    | **MIT** - OK for this project                                                                                                                                                     |
| Role                       | Client-side PDF load / create / copy pages (merge, later split)                                                                                                                   |
| Approx. published min+gzip | ~200 KB (`dist/pdf-lib.min.js` gzip’d ≈ 206 KB)                                                                                                                                   |
| Bundle note                | Tree-shaken ESM import (`PDFDocument`) lands in the React island chunk; expect on the order of **~150–220 KB gzip** for the merge tool’s JS depending on bundler output. No WASM. |

Processing stays in the browser. Do not send PDF bytes to a server.
