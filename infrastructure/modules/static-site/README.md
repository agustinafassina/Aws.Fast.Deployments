# 🧩 Module: `static-site`

**Language / Idioma:** [English](#english) · [Español](#español)

<a id="english"></a>

Provisions everything one static site needs in **one** environment:

- A **private** S3 bucket (encrypted, versioned for rollback).
- A **CloudFront distribution** fronting the bucket via **Origin Access Control**
  (OAC) — the bucket is never publicly readable.
- A least-privilege bucket policy allowing only that distribution to read.
- A **CloudFront Response Headers Policy** (HSTS, CSP, X-Frame-Options, etc.) —
  enabled by default.
- **AWS WAF v2** attached to CloudFront (managed rule sets + rate limiting) —
  enabled by default.
- A **CloudWatch alarm** on blocked WAF requests → SNS notification.
- Optional custom domains + ACM certificate.
- Optional SPA fallback (403/404 → `index.html`).

You instantiate this module once per site **per environment**. The environment
root config (`infrastructure/deployments/` — use workspace `staging` or `production`) does this for
you with a `for_each` over the site map, so adding a site = adding one map entry.

## Usage

```hcl
module "example_site" {
  source = "../../modules/static-site"

  site_name   = "example-site"
  environment = "staging"
  bucket_name = "example-site-staging-acme-123"

  # Optional custom domain
  domains             = ["staging.example.com"]
  acm_certificate_arn = "arn:aws:acm:us-east-1:...:certificate/..."

  enable_versioning = true
  spa_mode          = false
}
```

## Key inputs

| Variable | Default | Description |
|----------|---------|-------------|
| `site_name` | — | Internal id (kebab-case). |
| `environment` | — | `staging` or `production`. |
| `bucket_name` | — | Globally-unique bucket name. |
| `domains` | `[]` | Alternate CNAMEs; empty uses the CloudFront default domain. |
| `acm_certificate_arn` | `""` | ACM cert in **us-east-1**; required if `domains` set. |
| `spa_mode` | `false` | Route 403/404 to `index.html`. |
| `enable_versioning` | `true` | S3 versioning for rollback. |
| `noncurrent_version_expiration_days` | `90` | Prune old versions. |
| `enable_security_headers` | `true` | Attach Response Headers Policy (HSTS, CSP, etc.). |
| `content_security_policy` | restrictive default | CSP header; override if using external CDNs. |
| `permissions_policy` | restrictive default | Permissions-Policy header value. |
| `hsts_max_age_sec` | `63072000` | HSTS max-age (2 years). |
| `enable_waf` | `true` | Attach WAF Web ACL to CloudFront. |
| `enable_waf_alarm` | `true` | CloudWatch alarm on blocked requests. |
| `waf_rate_limit_per_ip` | `2000` | Per-IP rate limit per 5 min (0 = off). |
| `waf_blocked_requests_alarm_threshold` | `500` | Alarm when blocked requests exceed this in 5 min. |
| `waf_alarm_sns_topic_arn` | `""` | Shared SNS topic (set by environment root). |
| `waf_alarm_email` | `""` | Per-site email subscription (if no shared topic). |

## Security headers (enabled by default)

When `enable_security_headers = true` (default), every response includes:

| Header | Value |
|--------|-------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `Content-Security-Policy` | `default-src 'self'; …` (see `content_security_policy` variable) |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), …` |

Override `content_security_policy` per site if you load scripts/styles from a CDN
(e.g. add `https://cdn.example.com` to `script-src` / `style-src`).

## WAF & alarms (enabled by default)

When `enable_waf = true` (default), a WAF Web ACL is attached to CloudFront with:

| Rule | Purpose |
|------|---------|
| `AWSManagedRulesCommonRuleSet` | SQLi, XSS, path traversal, etc. |
| `AWSManagedRulesKnownBadInputsRuleSet` | Log4j, known exploit patterns |
| `AWSManagedRulesAmazonIpReputationList` | Block known-malicious IPs |
| `RateLimitPerIp` | 2000 req / 5 min / IP (disable with `waf_rate_limit_per_ip = 0`) |

A CloudWatch alarm fires when **blocked requests** exceed `waf_blocked_requests_alarm_threshold`
(default 500) in a 5-minute window. Notifications go to an SNS topic — preferably the
**shared topic** created at the environment level via `waf_alarm_email` in
`terraform.tfvars` (one email for all sites). Confirm the SNS subscription email
after the first `terraform apply`.

> WAF has a per-WebACL monthly cost. With many sites, review AWS WAF pricing.

## Outputs

| Output | Use |
|--------|-----|
| `bucket_name` | Paste into `config/sites.json` → `bucket`. |
| `distribution_id` | Paste into `config/sites.json` → `distributionId`. |
| `distribution_domain_name` | Point your DNS CNAME at this. |
| `security_headers_policy_id` | CloudFront policy ID (for debugging). |
| `waf_web_acl_arn` | WAF Web ACL ARN. |
| `waf_alarm_topic_arn` | SNS topic for WAF alarms. |
| `waf_alarm_name` | CloudWatch alarm name. |

## Notes

- CloudFront + ACM for custom domains **must** use `us-east-1`. The environment
  providers are pinned accordingly.
- Uses the AWS-managed `CachingOptimized` cache policy. Cache invalidations are
  handled at deploy time by `pipelines/scripts/invalidate-cloudfront.js`.

---

<a id="español"></a>

# 🧩 Módulo: `static-site`

**Idioma / Language:** [Español](#español) · [English](#english)

Aprovisiona todo lo que un sitio estático necesita en **un** entorno:

- Un bucket S3 **privado** (cifrado, con versionado para rollback).
- Una **distribución CloudFront** frente al bucket vía **Origin Access Control**
  (OAC) — el bucket nunca es públicamente legible.
- Una policy de bucket de mínimo privilegio que permite leer solo a esa
  distribución.
- Una **CloudFront Response Headers Policy** (HSTS, CSP, X-Frame-Options, etc.) —
  habilitada por defecto.
- **AWS WAF v2** adjunto a CloudFront (rule sets administrados + rate limiting) —
  habilitado por defecto.
- Una **alarma de CloudWatch** por requests bloqueados por WAF → notificación SNS.
- Dominios personalizados + certificado ACM opcionales.
- Fallback SPA opcional (403/404 → `index.html`).

Instanciás este módulo una vez por sitio **por entorno**. Las configs raíz de
cada entorno (`infrastructure/deployments/` — workspace `staging` o `production`) lo hacen por
vos con un `for_each` sobre el mapa de sitios: agregar un sitio = agregar una
entrada al mapa.

## Uso

```hcl
module "example_site" {
  source = "../../modules/static-site"

  site_name   = "example-site"
  environment = "staging"
  bucket_name = "example-site-staging-acme-123"

  # Dominio personalizado opcional
  domains             = ["staging.example.com"]
  acm_certificate_arn = "arn:aws:acm:us-east-1:...:certificate/..."

  enable_versioning = true
  spa_mode          = false
}
```

## Inputs principales

| Variable | Default | Descripción |
|----------|---------|-------------|
| `site_name` | — | Id interno (kebab-case). |
| `environment` | — | `staging` o `production`. |
| `bucket_name` | — | Nombre de bucket globalmente único. |
| `domains` | `[]` | CNAMEs alternativos; vacío usa el dominio default de CloudFront. |
| `acm_certificate_arn` | `""` | Certificado ACM en **us-east-1**; requerido si `domains` está definido. |
| `spa_mode` | `false` | Redirige 403/404 a `index.html`. |
| `enable_versioning` | `true` | Versionado S3 para rollback. |
| `noncurrent_version_expiration_days` | `90` | Elimina versiones antiguas. |
| `enable_security_headers` | `true` | Adjunta Response Headers Policy (HSTS, CSP, etc.). |
| `content_security_policy` | default restrictivo | Header CSP; override si usás CDNs externos. |
| `permissions_policy` | default restrictivo | Valor del header Permissions-Policy. |
| `hsts_max_age_sec` | `63072000` | max-age de HSTS (2 años). |
| `enable_waf` | `true` | Adjunta WAF Web ACL a CloudFront. |
| `enable_waf_alarm` | `true` | Alarma CloudWatch por requests bloqueados. |
| `waf_rate_limit_per_ip` | `2000` | Rate limit por IP cada 5 min (0 = off). |
| `waf_blocked_requests_alarm_threshold` | `500` | Alarma si se supera este umbral en 5 min. |
| `waf_alarm_sns_topic_arn` | `""` | Topic SNS compartido (lo setea el entorno). |
| `waf_alarm_email` | `""` | Email por sitio (si no hay topic compartido). |

## Cabeceras de seguridad (habilitadas por defecto)

Con `enable_security_headers = true` (default), cada respuesta incluye:

| Header | Valor |
|--------|-------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `Content-Security-Policy` | `default-src 'self'; …` (ver variable `content_security_policy`) |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), …` |

Sobrescribí `content_security_policy` por sitio si cargás scripts/estilos desde un
CDN (ej. agregar `https://cdn.example.com` a `script-src` / `style-src`).

## WAF y alarmas (habilitados por defecto)

Con `enable_waf = true` (default), se adjunta un WAF Web ACL a CloudFront con:

| Regla | Propósito |
|-------|-----------|
| `AWSManagedRulesCommonRuleSet` | SQLi, XSS, path traversal, etc. |
| `AWSManagedRulesKnownBadInputsRuleSet` | Log4j, patrones de exploit conocidos |
| `AWSManagedRulesAmazonIpReputationList` | Bloquea IPs maliciosas conocidas |
| `RateLimitPerIp` | 2000 req / 5 min / IP (desactivar con `waf_rate_limit_per_ip = 0`) |

Una alarma de CloudWatch se dispara cuando los **requests bloqueados** superan
`waf_blocked_requests_alarm_threshold` (default 500) en una ventana de 5 minutos.
Las notificaciones van a un topic SNS — preferentemente el **topic compartido**
creado a nivel de entorno con `waf_alarm_email` en `terraform.tfvars` (un email
para todos los sitios). Confirmá la suscripción SNS por email tras el primer
`terraform apply`.

> WAF tiene costo mensual por Web ACL. Con muchos sitios, revisá el pricing de AWS WAF.

## Outputs

| Output | Uso |
|--------|-----|
| `bucket_name` | Pegar en `config/sites.json` → `bucket`. |
| `distribution_id` | Pegar en `config/sites.json` → `distributionId`. |
| `distribution_domain_name` | Apuntar el CNAME de DNS acá. |
| `security_headers_policy_id` | ID de la policy de CloudFront (para debugging). |
| `waf_web_acl_arn` | ARN del WAF Web ACL. |
| `waf_alarm_topic_arn` | Topic SNS para alarmas WAF. |
| `waf_alarm_name` | Nombre de la alarma CloudWatch. |

## Notas

- CloudFront + ACM para dominios personalizados **deben** usar `us-east-1`. Los
  providers de cada entorno están fijados en consecuencia.
- Usa la cache policy administrada por AWS `CachingOptimized`. Las
  invalidaciones de caché se manejan en tiempo de deploy con
  `pipelines/scripts/invalidate-cloudfront.js`.
