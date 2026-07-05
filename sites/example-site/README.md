# 🌐 example-site

**Language / Idioma:** [English](#english) · [Español](#español)

<a id="english"></a>

## About

| Field | Value |
|-------|-------|
| **Purpose** | Reference landing page for the AWS Fast Deployments boilerplate. Demonstrates the standard site structure and deploy flow. |
| **Audience** | Developers onboarding to this monorepo. |
| **Version** | `1.0.0` |
| **Owner** | _Platform team — replace with your business owner_ |
| **Maintainer** | _Platform team — replace with your technical maintainer_ |
| **Review contact** | `@platform-team` — tag on PRs touching this site |
| **Escalation** | `ops@example.com` — production incidents |

## Domains

| Environment | URL |
|-------------|-----|
| Staging | `staging.example.com` (see `config/sites.json`) |
| Production | `www.example.com` (see `config/sites.json`) |

## Structure

```
example-site/
├── src/            # authoring source — edit these files
│   ├── index.html
│   ├── css/style.css
│   └── js/main.js
└── README.md
```

- `src/` is the input. The build step outputs optimized files to `dist/`
  (git-ignored). If `buildCommand` is empty in `config/sites.json`, `src/` is
  deployed as-is.

## Local preview

```bash
npx serve sites/example-site/src
```

## Deploy & infrastructure

Buckets and CloudFront distributions are defined in `config/sites.json` under
`example-site`. Infrastructure is in `infrastructure/`.

## Checklist

Before merging changes, see [`docs/site-checklist.md`](../../docs/site-checklist.md)
and [`docs/html-guidelines.md`](../../docs/html-guidelines.md).

---

<a id="español"></a>

## Acerca de

| Campo | Valor |
|-------|-------|
| **Propósito** | Landing de referencia del boilerplate AWS Fast Deployments. Muestra la estructura estándar y el flujo de deploy. |
| **Audiencia** | Desarrolladores que se incorporan a este monorepo. |
| **Versión** | `1.0.0` |
| **Owner** | _Equipo plataforma — reemplazar con el owner de negocio_ |
| **Maintainer** | _Equipo plataforma — reemplazar con el maintainer técnico_ |
| **Contacto de revisión** | `@equipo-plataforma` — taguear en PRs que toquen este sitio |
| **Escalación** | `ops@example.com` — incidentes en producción |

## Dominios

| Entorno | URL |
|---------|-----|
| Staging | `staging.example.com` (ver `config/sites.json`) |
| Producción | `www.example.com` (ver `config/sites.json`) |

## Estructura

```
example-site/
├── src/            # código fuente — editá estos archivos
│   ├── index.html
│   ├── css/style.css
│   └── js/main.js
└── README.md
```

- `src/` es la entrada. El build genera `dist/` (git-ignored).

## Vista previa local

```bash
npx serve sites/example-site/src
```

## Deploy e infraestructura

Buckets y distribuciones CloudFront en `config/sites.json` bajo `example-site`.
Infraestructura en `infrastructure/`.

## Checklist

Antes de mergear, ver [`docs/site-checklist.md`](../../docs/site-checklist.md) y
[`docs/html-guidelines.md`](../../docs/html-guidelines.md).
