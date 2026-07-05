# Site & repository checklist

**Language / Idioma:** [English](#english) · [Español](#español)

Generic checklist for **every site** and **every folder** in this monorepo. Use it
when creating a site, opening a PR, or handing off ownership. For HTML-specific
security details see [`html-guidelines.md`](html-guidelines.md).

---

<a id="english"></a>

## Per-site README (required)

Every folder under `sites/<name>/` **must** have an up-to-date `README.md` with at
least:

| Field | What to document |
|-------|------------------|
| **Purpose** | What this site is for (one paragraph). |
| **Audience** | Who visits it (customers, internal staff, partners, etc.). |
| **Version** | Current release label (e.g. `1.2.0` or `2026-Q2`) — update on meaningful releases. |
| **Owner** | Business/product owner (team or person). Accountable for content and priorities. |
| **Maintainer** | Technical owner (team or person). Accountable for code, deploys and fixes. |
| **Review contact** | Who to tag on PRs for this site (e.g. `@team-frontend`). |
| **Escalation** | Who to contact for production incidents (e.g. `ops@company.com`). |
| **Domains** | Staging and production URLs (or pointer to `config/sites.json`). |
| **Structure** | Brief map of `src/` (and `dist/` if built). |
| **Local preview** | How to run the site locally. |

> Copy the template from `sites/example-site/README.md` or run `npm run create-site`.

## Per-folder README (recommended)

Other top-level folders should keep their README current:

| Folder | README should explain |
|--------|----------------------|
| `config/` | Central registry, how values flow to pipeline/scripts. |
| `shared/` | What is shared, impact of changes (rebuilds all sites). |
| `infrastructure/` | Terraform model, how to add a site, WAF/alarms. |
| `pipelines/` | CI/CD flow, branch model, local script usage. |
| `docs/` | Index of guides and checklists (this file). |

## Code checklist (before every PR)

- [ ] Changes are scoped to the intended site (or `shared/` with awareness of global impact).
- [ ] `npm run lint` passes for affected paths.
- [ ] No secrets, tokens, API keys or internal URLs in HTML/JS/CSS.
- [ ] `target="_blank"` links use `rel="noopener noreferrer"`.
- [ ] External scripts/styles use HTTPS; prefer SRI on CDNs.
- [ ] Semantic HTML, `lang`, `title`, `viewport`, `charset`, meaningful `alt` on images.
- [ ] Site `README.md` updated if purpose, owner, maintainer or version changed.
- [ ] `config/sites.json` updated if deploy targets or build settings changed.
- [ ] Tested locally (`npx serve sites/<name>/src` or built `dist/`).
- [ ] Tested on **staging** (`develop`) before requesting **production** (`master`) approval.

## Security checklist (summary)

Infrastructure (provisioned by Terraform — see root README):

- [ ] Private S3 buckets + CloudFront OAC (no public bucket access).
- [ ] HTTPS only; security headers (HSTS, CSP, X-Frame-Options, etc.).
- [ ] AWS WAF on CloudFront (managed rules + rate limiting).
- [ ] CloudWatch alarm on WAF blocked requests → SNS (set `waf_alarm_email` in tfvars).
- [ ] No credentials in repo; AWS via service connection / env vars.

Application / HTML (detail in [`html-guidelines.md`](html-guidelines.md)):

- [ ] No secrets in static files.
- [ ] CSP compatible with your assets (override in tfvars if using external CDNs).
- [ ] No sensitive data in HTML comments or client-side logs.

## Governance & ownership

- [ ] Every site has a named **owner** and **maintainer** in its README.
- [ ] PRs touching `sites/<name>/` tag the site's **review contact**.
- [ ] Production deploys (`master`) require manual approval in Azure DevOps.
- [ ] Incidents: escalate via **escalation contact** in the site README.
- [ ] Deprecating a site: remove from pipeline triggers, tfvars, `sites.json`, and archive the folder (don't leave orphan infrastructure).

## New site checklist

- [ ] `npm run create-site --name <kebab-name> …`
- [ ] Fill site `README.md` (purpose, owner, maintainer, contacts, version).
- [ ] Add Terraform tfvars entries (staging + production) and `terraform apply`.
- [ ] Paste bucket + distribution IDs into `config/sites.json`.
- [ ] Confirm SNS subscription for WAF alarms (if `waf_alarm_email` is set).
- [ ] Push to `develop` → verify staging → merge to `master` → approve production.

---

<a id="español"></a>

## README por sitio (obligatorio)

Cada carpeta bajo `sites/<nombre>/` **debe** tener un `README.md` actualizado con al menos:

| Campo | Qué documentar |
|-------|----------------|
| **Propósito** | Para qué sirve este sitio (un párrafo). |
| **Audiencia** | Quién lo visita (clientes, staff interno, partners, etc.). |
| **Versión** | Etiqueta de release actual (ej. `1.2.0` o `2026-Q2`) — actualizar en releases relevantes. |
| **Owner** | Responsable de negocio/producto (equipo o persona). Prioridades y contenido. |
| **Maintainer** | Responsable técnico (equipo o persona). Código, deploys y fixes. |
| **Contacto de revisión** | A quién taguear en PRs de este sitio (ej. `@equipo-frontend`). |
| **Escalación** | A quién contactar por incidentes en producción (ej. `ops@empresa.com`). |
| **Dominios** | URLs de staging y producción (o referencia a `config/sites.json`). |
| **Estructura** | Mapa breve de `src/` (y `dist/` si hay build). |
| **Vista previa local** | Cómo correr el sitio en local. |

> Copiá la plantilla de `sites/example-site/README.md` o ejecutá `npm run create-site`.

## README por carpeta (recomendado)

Las carpetas de primer nivel deben mantener su README al día:

| Carpeta | El README debe explicar |
|---------|-------------------------|
| `config/` | Registro central, flujo de valores al pipeline/scripts. |
| `shared/` | Qué se comparte, impacto de cambios (rebuild de todos los sitios). |
| `infrastructure/` | Modelo Terraform, cómo agregar sitio, WAF/alarmas. |
| `pipelines/` | Flujo CI/CD, modelo de ramas, scripts locales. |
| `docs/` | Índice de guías y checklists (este archivo). |

## Checklist de código (antes de cada PR)

- [ ] Los cambios están acotados al sitio correcto (o `shared/` sabiendo el impacto global).
- [ ] `npm run lint` pasa en los paths afectados.
- [ ] Sin secretos, tokens, API keys ni URLs internas en HTML/JS/CSS.
- [ ] Links con `target="_blank"` usan `rel="noopener noreferrer"`.
- [ ] Scripts/estilos externos por HTTPS; preferir SRI en CDNs.
- [ ] HTML semántico, `lang`, `title`, `viewport`, `charset`, `alt` significativos en imágenes.
- [ ] `README.md` del sitio actualizado si cambió propósito, owner, maintainer o versión.
- [ ] `config/sites.json` actualizado si cambiaron destinos de deploy o build.
- [ ] Probado en local (`npx serve sites/<nombre>/src` o `dist/` buildeado).
- [ ] Probado en **staging** (`develop`) antes de pedir aprobación a **producción** (`master`).

## Checklist de seguridad (resumen)

Infraestructura (aprovisionada por Terraform — ver README raíz):

- [ ] Buckets S3 privados + CloudFront OAC (sin acceso público al bucket).
- [ ] Solo HTTPS; cabeceras de seguridad (HSTS, CSP, X-Frame-Options, etc.).
- [ ] AWS WAF en CloudFront (reglas administradas + rate limiting).
- [ ] Alarma CloudWatch por requests bloqueados WAF → SNS (`waf_alarm_email` en tfvars).
- [ ] Sin credenciales en el repo; AWS vía service connection / variables de entorno.

Aplicación / HTML (detalle en [`html-guidelines.md`](html-guidelines.md)):

- [ ] Sin secretos en archivos estáticos.
- [ ] CSP compatible con tus assets (override en tfvars si usás CDNs externos).
- [ ] Sin datos sensibles en comentarios HTML ni logs del cliente.

## Gobernanza y ownership

- [ ] Cada sitio tiene **owner** y **maintainer** nombrados en su README.
- [ ] PRs que tocan `sites/<nombre>/` taguean al **contacto de revisión** del sitio.
- [ ] Deploys a producción (`master`) requieren aprobación manual en Azure DevOps.
- [ ] Incidentes: escalar vía **contacto de escalación** del README del sitio.
- [ ] Deprecar un sitio: sacarlo de triggers, tfvars, `sites.json` y archivar la carpeta (no dejar infra huérfana).

## Checklist sitio nuevo

- [ ] `npm run create-site --name <kebab-nombre> …`
- [ ] Completar `README.md` del sitio (propósito, owner, maintainer, contactos, versión).
- [ ] Agregar entradas tfvars (staging + production) y `terraform apply`.
- [ ] Pegar bucket + distribution IDs en `config/sites.json`.
- [ ] Confirmar suscripción SNS para alarmas WAF (si `waf_alarm_email` está configurado).
- [ ] Push a `develop` → verificar staging → merge a `master` → aprobar producción.
