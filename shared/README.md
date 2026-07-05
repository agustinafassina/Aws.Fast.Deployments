# 📦 `shared/` — Common resources

**Language / Idioma:** [English](#english) · [Español](#español)

<a id="english"></a>

Reusable assets, styles and scripts that multiple sites depend on.

```
shared/
├── css/      # e.g. reset.css, design tokens, shared components
├── js/       # e.g. analytics.js, utility modules
└── assets/   # logos, fonts, shared images
```

## How sites consume shared resources

There are two supported strategies; pick per site:

1. **Copy at build time (recommended for isolation).**
   The build script (`pipelines/scripts/build-site.js`) copies referenced
   `shared/` files into each site's `dist/` so every deployed bucket is
   self-contained. This keeps CloudFront invalidations scoped to one site.

2. **Reference a common path.**
   If you prefer a single shared bucket/distribution, deploy `shared/` once and
   reference it via absolute URLs. (Not the default in this boilerplate because
   it couples site deployments.)

## Change detection note

Because `shared/` is used by many sites, a change to a file here can affect
**all** sites. `detect-changes.js` treats `shared/` changes as "rebuild every
site" by default (configurable via `SHARED_AFFECTS_ALL`). This guarantees a
shared CSS fix is redeployed everywhere, at the cost of a larger pipeline run.

Keep this README updated when adding shared assets. See
[`docs/site-checklist.md`](../docs/site-checklist.md) for folder documentation standards.

---

<a id="español"></a>

# 📦 `shared/` — Recursos comunes

**Idioma / Language:** [Español](#español) · [English](#english)

Assets, estilos y scripts reutilizables de los que dependen varios sitios.

```
shared/
├── css/      # ej. reset.css, design tokens, componentes compartidos
├── js/       # ej. analytics.js, módulos de utilidad
└── assets/   # logos, fuentes, imágenes compartidas
```

## Cómo consumen los sitios los recursos compartidos

Hay dos estrategias soportadas; elegí una por sitio:

1. **Copiar en tiempo de build (recomendado para aislamiento).**
   El script de build (`pipelines/scripts/build-site.js`) copia los archivos de
   `shared/` referenciados al `dist/` de cada sitio, de modo que cada bucket
   desplegado sea autocontenido. Esto mantiene las invalidaciones de CloudFront
   acotadas a un solo sitio.

2. **Referenciar una ruta común.**
   Si preferís un único bucket/distribución compartida, desplegá `shared/` una
   vez y referenciálo con URLs absolutas. (No es el default en este boilerplate
   porque acopla los deploys de los sitios.)

## Nota sobre detección de cambios

Como `shared/` lo usan muchos sitios, un cambio acá puede afectar a **todos**.
`detect-changes.js` trata los cambios en `shared/` como "reconstruir todos los
sitios" por defecto (configurable con `SHARED_AFFECTS_ALL`). Esto garantiza que
un fix de CSS compartido se redespliegue en todos lados, a costa de una corrida
de pipeline más grande.

Mantené este README actualizado al agregar assets compartidos. Ver
[`docs/site-checklist.md`](../docs/site-checklist.md) para estándares de documentación por carpeta.
