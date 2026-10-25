// MapLibre 6 deduce la URL de su worker de `import.meta.url`, que deja de ser válida al
// empaquetarse con Next. Se sirve desde /public y se indica con setWorkerUrl().
import { copyFileSync, mkdirSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"

const require = createRequire(import.meta.url)
const pkgDir = dirname(require.resolve("maplibre-gl/package.json"))
mkdirSync("public", { recursive: true })
copyFileSync(join(pkgDir, "dist", "maplibre-gl-worker.mjs"), join("public", "maplibre-gl-worker.mjs"))
