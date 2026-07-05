# HTML guide: best practices, checklist & security

**Language / Idioma:** [English](#english) · [Español](#español)

<a id="english"></a>

A practical checklist for every site in this monorepo (static HTML/CSS/JS served
from **S3 + CloudFront**). Designed so that **nothing slips through** during PR
review. Use it as a verification list before merging.

> Project golden rule: buckets are **private** and served only through CloudFront
> (OAC). HTML must never contain secrets or credentials — everything sensitive
> lives in environment variables / service connections (see README).

---

## 1. HTML structure & semantics

- [ ] `<!DOCTYPE html>` at the very top (required; enforced by `htmlhint`).
- [ ] `<html lang="en">` (or the correct language) for accessibility and SEO.
- [ ] `<meta charset="utf-8">` as the **first** element inside `<head>`.
- [ ] `<meta name="viewport" content="width=device-width, initial-scale=1">`.
- [ ] A unique, descriptive `<title>` per page (enforced by `htmlhint`).
- [ ] Use semantic tags: `<header>`, `<nav>`, `<main>`, `<section>`,
      `<article>`, `<footer>` instead of `<div>` for everything.
- [ ] A single `<h1>` per page; heading hierarchy without skips (`h1→h2→h3`).
- [ ] Lowercase attributes and IDs, double quotes, no duplicate IDs
      (rules active in `.htmlhintrc`).
- [ ] Close all tags correctly (no orphan tags).

## 2. Accessibility (a11y)

- [ ] Every `<img>` has a meaningful `alt` (empty `alt=""` only if decorative).
- [ ] Forms: each input has its associated `<label for="...">`.
- [ ] Sufficient color contrast (WCAG AA: 4.5:1 for normal text).
- [ ] Visible focus on interactive elements; working keyboard navigation.
- [ ] Use `<button>` for actions and `<a href>` for navigation.
- [ ] Use `aria-*` only when native semantics aren't enough.

## 3. SEO & metadata

- [ ] `<meta name="description">` per page (unique and relevant).
- [ ] Open Graph / Twitter Cards (`og:title`, `og:description`, `og:image`, `og:url`).
- [ ] `<link rel="canonical">` to avoid duplicate content.
- [ ] URLs and `og:url` pointing to the production domain, not CloudFront.
- [ ] `robots.txt` and `sitemap.xml` if the site is public and indexable.
- [ ] `<html lang>` and, if applicable, `hreflang` for multi-language sites.

## 4. Performance

- [ ] Optimized images (WebP/AVIF) with `width`/`height` to avoid CLS.
- [ ] `loading="lazy"` on images outside the initial viewport.
- [ ] Minified CSS and JS — `build-site.js` outputs to `dist/`.
- [ ] Immutable assets use long cache; HTML uses `no-cache` (set at deploy time).
- [ ] `<script>` with `defer` or `type="module"`.
- [ ] Avoid large inline CSS/JS; prefer cacheable external files.

## 5. Security

### In the HTML / code

- [ ] **No secrets in HTML/JS** — everything static is public.
- [ ] `target="_blank"` **always** has `rel="noopener noreferrer"`.
- [ ] Never use `innerHTML` with untrusted content (XSS). Prefer `textContent`.
- [ ] Third-party CDNs with **SRI**: `integrity="sha384-..."` + `crossorigin`.
- [ ] Load everything over **HTTPS**; no mixed content.
- [ ] No sensitive info in HTML comments.

### Security headers (CloudFront — provisioned by IaC)

The `static-site` Terraform module attaches a **Response Headers Policy** by
default (`enable_security_headers = true`). These headers are sent on every
response — no `<meta http-equiv>` needed:

| Header | Default |
|--------|---------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `Content-Security-Policy` | `default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` |

If a site loads assets from an external CDN, override `content_security_policy`
in the site's Terraform tfvars entry (add the CDN origin to `script-src` /
`style-src`).

HTTP→HTTPS redirect is handled by CloudFront (`redirect-to-https`).

### Infrastructure (covered by IaC)

- [ ] Private S3 buckets (Public Access Block).
- [ ] OAC + least-privilege bucket policy.
- [ ] S3 versioning for rollback.
- [ ] TLS `TLSv1.2_2021` minimum with custom domains.
- [ ] **AWS WAF** on CloudFront (managed rules + rate limiting) with CloudWatch alarm on blocked requests.

## 6. Errors & routing

- [ ] Define `404.html` (and `403.html` if applicable).
- [ ] SPAs: `spa_mode = true` in Terraform.
- [ ] Internal links relative so they work in staging and production.

## 7. Before merging

- [ ] `npm run lint` passes.
- [ ] `npm run validate:config` if you touched `config/sites.json`.
- [ ] No secrets in the diff.
- [ ] `target="_blank"` → `rel="noopener noreferrer"`.
- [ ] External resources → HTTPS + SRI.
- [ ] `alt`, `lang`, `title`, `viewport`, `charset` present.
- [ ] Tested on staging (`develop`) before approving production (`master`).

### How this is enforced automatically

- **Linting**: `htmlhint`, `stylelint`, `eslint` in `StagingCI` (changed sites only).
- **No secrets**: `.gitignore` + Azure DevOps service connection.
- **HTTPS + private buckets + OAC + security headers + WAF**: `static-site` Terraform module.

---

<a id="español"></a>

# Guía de HTML: buenas prácticas, checklist y seguridad

**Idioma / Language:** [Español](#español) · [English](#english)

Checklist práctico para todos los sitios de este monorepo (HTML/CSS/JS estático
servido desde **S3 + CloudFront**). Pensado para que **nada se escape** en la
revisión de un PR.

> Regla de oro: los buckets son **privados** y se sirven solo por CloudFront
> (OAC). El HTML no debe contener secretos — lo sensible vive en variables de
> entorno / service connections (ver README).

---

## 1. Estructura y semántica del HTML

- [ ] `<!DOCTYPE html>` al inicio (obligatorio; lo exige `htmlhint`).
- [ ] `<html lang="es">` (o el idioma correcto).
- [ ] `<meta charset="utf-8">` como **primer** elemento dentro de `<head>`.
- [ ] `<meta name="viewport" content="width=device-width, initial-scale=1">`.
- [ ] `<title>` único y descriptivo por página.
- [ ] Etiquetas semánticas: `<header>`, `<nav>`, `<main>`, `<section>`, etc.
- [ ] Un solo `<h1>` por página; jerarquía sin saltos.
- [ ] Atributos e IDs en minúscula, comillas dobles, sin IDs duplicados.
- [ ] Cerrar todas las etiquetas correctamente.

## 2. Accesibilidad (a11y)

- [ ] Todas las `<img>` con `alt` significativo.
- [ ] Formularios: cada input con su `<label for="...">`.
- [ ] Contraste de color suficiente (WCAG AA: 4.5:1).
- [ ] Foco visible; navegación por teclado funcional.
- [ ] `<button>` para acciones, `<a href>` para navegación.
- [ ] `aria-*` solo cuando la semántica nativa no alcanza.

## 3. SEO y metadatos

- [ ] `<meta name="description">` por página.
- [ ] Open Graph / Twitter Cards.
- [ ] `<link rel="canonical">`.
- [ ] URLs y `og:url` apuntando al dominio de producción.
- [ ] `robots.txt` y `sitemap.xml` si el sitio es indexable.
- [ ] `hreflang` para sitios multi-idioma.

## 4. Rendimiento

- [ ] Imágenes optimizadas (WebP/AVIF) con `width`/`height`.
- [ ] `loading="lazy"` fuera del viewport inicial.
- [ ] CSS/JS minificados — `build-site.js` genera `dist/`.
- [ ] Assets inmutables con cache largo; HTML con `no-cache`.
- [ ] `<script defer>` o `type="module"`.
- [ ] Evitar CSS/JS inline grande.

## 5. Seguridad

### En el HTML / código

- [ ] **Sin secretos en HTML/JS** — todo lo estático es público.
- [ ] `target="_blank"` **siempre** con `rel="noopener noreferrer"`.
- [ ] No usar `innerHTML` con contenido no confiable (XSS).
- [ ] CDNs externos con **SRI** (`integrity` + `crossorigin`).
- [ ] Todo por **HTTPS**; sin mixed content.
- [ ] Sin info sensible en comentarios HTML.

### Cabeceras de seguridad (CloudFront — aprovisionadas por IaC)

El módulo Terraform `static-site` adjunta una **Response Headers Policy** por
defecto (`enable_security_headers = true`). Estas cabeceras van en cada
respuesta — no hace falta `<meta http-equiv>`:

| Header | Valor por defecto |
|--------|-------------------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `Content-Security-Policy` | `default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` |

Si un sitio carga assets de un CDN externo, sobrescribí `content_security_policy`
en la entrada tfvars del sitio (agregar el origen del CDN a `script-src` /
`style-src`).

La redirección HTTP→HTTPS la maneja CloudFront (`redirect-to-https`).

### Infraestructura (cubierta por IaC)

- [ ] Buckets S3 privados (Public Access Block).
- [ ] OAC + policy de mínimo privilegio.
- [ ] Versionado S3 para rollback.
- [ ] TLS mínimo `TLSv1.2_2021` con dominios propios.
- [ ] **AWS WAF** en CloudFront (reglas administradas + rate limiting) con alarma CloudWatch por requests bloqueados.

## 6. Errores y routing

- [ ] Definir `404.html`.
- [ ] SPAs: `spa_mode = true` en Terraform.
- [ ] Links internos relativos para staging y producción.

## 7. Antes de mergear

- [ ] `npm run lint` pasa.
- [ ] `npm run validate:config` si tocaste `config/sites.json`.
- [ ] Sin secretos en el diff.
- [ ] `target="_blank"` → `rel="noopener noreferrer"`.
- [ ] Recursos externos → HTTPS + SRI.
- [ ] `alt`, `lang`, `title`, `viewport`, `charset` presentes.
- [ ] Probado en staging (`develop`) antes de aprobar producción (`master`).

### Cómo se refuerza automáticamente

- **Linting**: `htmlhint`, `stylelint`, `eslint` en `StagingCI` (solo sitios modificados).
- **Sin secretos**: `.gitignore` + service connection de Azure DevOps.
- **HTTPS + buckets privados + OAC + cabeceras de seguridad + WAF**: módulo Terraform `static-site`.
