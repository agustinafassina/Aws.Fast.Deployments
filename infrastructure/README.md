# 🏗️ `infrastructure/` — AWS infrastructure as code (Terraform)

**Language / Idioma:** [English](#english) · [Español](#español)

<a id="english"></a>

Defines all AWS hosting resources for every site, in every environment, as code.

```
infrastructure/
├── modules/
│   └── static-site/          # reusable module: 1 S3 bucket + 1 CloudFront dist
├── deployments/              # single Terraform root — workspaces staging | production
│   ├── locals.tf             # tags + environment = terraform.workspace
│   ├── staging.tfvars        # sites for staging workspace (git-ignored)
│   └── production.tfvars     # sites for production workspace (git-ignored)
└── README.md
```

See [`deployments/README.md`](deployments/README.md) for workspace commands.

## Model

- Each **site × environment** = one `static-site` module instance = one private
  S3 bucket + one CloudFront distribution (with OAC).
- So one site consumes: **2 buckets** (staging + prod) and **2 distributions**
  (staging + prod).
- **One Terraform root** with **workspaces** `staging` and `production` — no
  duplicate `.tf` files. Site maps live in `staging.tfvars` and `production.tfvars`.
- **Tags** are defined in `locals.tf` (`project_name`, `additional_tags` in
  `terraform.tfvars`). The `Environment` tag comes from the active workspace.

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/downloads) >= 1.5
- AWS credentials with permission to manage S3 + CloudFront (locally via
  `aws configure` / env vars; in CI via the Azure DevOps AWS service connection).
- (Recommended) A remote state backend — see `deployments/backend.tf` (one bucket,
  separate state per workspace).

## First-time setup

```bash
cd infrastructure/deployments

cp terraform.tfvars.example terraform.tfvars
cp staging.tfvars.example staging.tfvars
cp production.tfvars.example production.tfvars
# edit bucket names + waf_alarm_email in both *.tfvars

terraform init
terraform workspace new staging
terraform workspace new production

terraform workspace select staging
terraform apply -var-file=staging.tfvars

terraform workspace select production
terraform apply -var-file=production.tfvars
```

Set `waf_alarm_email` in each workspace tfvars file. **Confirm the SNS
subscription** email after the first apply per workspace.

## Wiring outputs back into config

After `apply`, read the outputs and paste them into `config/sites.json`:

```bash
terraform output -json sites
```

Example output:

```json
{
  "example-site": {
    "bucket": "example-site-staging-acme-123",
    "distribution_id": "E1ABCDEF2GHIJK",
    "distribution_domain_name": "d1234abcd.cloudfront.net"
  }
}
```

→ set `sites[].environments.staging.bucket` and `.distributionId` accordingly.

## Adding a new site's infrastructure

1. Add a map entry to **`staging.tfvars`** and **`production.tfvars`**.
2. `terraform workspace select staging && terraform apply -var-file=staging.tfvars`
3. `terraform workspace select production && terraform apply -var-file=production.tfvars`
4. Copy outputs into `config/sites.json`.

> `npm run create-site` scaffolds the site folder and the `sites.json` entry and
> prints the exact tfvars snippet to paste here.

## Updating infrastructure

Change the tfvars / module inputs and re-run `terraform plan && terraform apply`
in the affected **workspace**. Staging and production state are isolated by
Terraform workspaces.

## Custom domains

1. Request/import an ACM certificate **in us-east-1** covering your domains.
2. Set `domains` and `acm_certificate_arn` on the site's tfvars entry.
3. `apply`, then point your DNS (CNAME / Route 53 alias) at the distribution's
   `distribution_domain_name`.

## Versioning & rollback

S3 **object versioning** is enabled by default (`enable_versioning = true`), and
old versions are pruned after `noncurrent_version_expiration_days` (default 90).
See the root README's "Rollback" section for how to restore a previous release.

## WAF & monitoring

Each site gets an **AWS WAF Web ACL** on its CloudFront distribution (managed
rules + per-IP rate limiting) and a **CloudWatch alarm** when blocked requests
spike. Configure a shared alarm email per environment:

```hcl
# terraform.tfvars
waf_alarm_email = "ops@example.com"
```

If a legitimate request is blocked (false positive), check WAF sampled requests in
the AWS console and add an exclusion rule or tune `waf_rate_limit_per_ip`.

---

<a id="español"></a>

# 🏗️ `infrastructure/` — Infraestructura AWS como código (Terraform)

**Idioma / Language:** [Español](#español) · [English](#english)

Define todos los recursos de hosting en AWS para cada sitio y cada entorno, como
código.

```
infrastructure/
├── modules/
│   └── static-site/
├── deployments/             # raíz Terraform única — workspaces staging | production
│   ├── locals.tf
│   ├── staging.tfvars
│   └── production.tfvars
└── README.md
```

Ver [`deployments/README.md`](deployments/README.md) para comandos de workspace.

## Modelo

- Cada **sitio × entorno** = una instancia del módulo `static-site`.
- Un sitio consume **2 buckets** y **2 distribuciones** (staging + prod).
- **Una sola raíz Terraform** con **workspaces** `staging` y `production` — sin
  archivos `.tf` duplicados. Los sitios van en `staging.tfvars` y `production.tfvars`.
- Los **tags** en `locals.tf`; `Environment` viene del workspace activo.

## Requisitos previos

- [Terraform](https://developer.hashicorp.com/terraform/downloads) >= 1.5
- Credenciales AWS con permiso para gestionar S3 + CloudFront (localmente vía
  `aws configure` / variables de entorno; en CI vía la service connection de AWS
  en Azure DevOps).
- (Recomendado) Backend de state remoto — ver `deployments/backend.tf`.

## Configuración inicial

```bash
cd infrastructure/deployments

cp terraform.tfvars.example terraform.tfvars
cp staging.tfvars.example staging.tfvars
cp production.tfvars.example production.tfvars

terraform init
terraform workspace new staging
terraform workspace new production

terraform workspace select staging
terraform apply -var-file=staging.tfvars

terraform workspace select production
terraform apply -var-file=production.tfvars
```

Configurá `waf_alarm_email` en cada archivo `*.tfvars` de workspace. Confirmá la
suscripción SNS tras el primer apply.

## Conectar los outputs con la config

Después de `apply`, leé los outputs y pegalos en `config/sites.json`:

```bash
terraform output -json sites
```

Ejemplo de output:

```json
{
  "example-site": {
    "bucket": "example-site-staging-acme-123",
    "distribution_id": "E1ABCDEF2GHIJK",
    "distribution_domain_name": "d1234abcd.cloudfront.net"
  }
}
```

→ configurá `sites[].environments.staging.bucket` y `.distributionId` en
consecuencia.

## Agregar infraestructura de un sitio nuevo

1. Agregá una entrada en **`staging.tfvars`** y **`production.tfvars`**.
2. `terraform workspace select staging && terraform apply -var-file=staging.tfvars`
3. `terraform workspace select production && terraform apply -var-file=production.tfvars`
4. Copiá outputs a `config/sites.json`.

> `npm run create-site` genera la carpeta del sitio y la entrada en `sites.json`
> e imprime el snippet exacto de tfvars para pegar acá.

## Actualizar infraestructura

Cambiá los tfvars y volvé a ejecutar `terraform plan && terraform apply` en el
**workspace** afectado. El state de staging y production está aislado por workspaces.

## Dominios personalizados

1. Solicitá/importá un certificado ACM **en us-east-1** que cubra tus dominios.
2. Configurá `domains` y `acm_certificate_arn` en la entrada tfvars del sitio.
3. `apply`, y apuntá tu DNS (CNAME / alias Route 53) al
   `distribution_domain_name` de la distribución.

## Versionado y rollback

El **versionado de objetos** de S3 está habilitado por defecto
(`enable_versioning = true`), y las versiones antiguas se eliminan después de
`noncurrent_version_expiration_days` (default 90). Ver la sección "Rollback" del
README raíz para restaurar un release anterior.

## WAF y monitoreo

Cada sitio recibe un **AWS WAF Web ACL** en su distribución CloudFront (reglas
administradas + rate limiting por IP) y una **alarma de CloudWatch** cuando los
requests bloqueados se disparan. Configurá un email compartido por entorno:

```hcl
# terraform.tfvars
waf_alarm_email = "ops@example.com"
```

Si un request legítimo es bloqueado (falso positivo), revisá los sampled requests
de WAF en la consola AWS y agregá una regla de exclusión o ajustá
`waf_rate_limit_per_ip`.
