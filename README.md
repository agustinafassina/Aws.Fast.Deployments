# AWS Fast Deployments

**Language / Idioma:** [English](#english) · [Español](#español)

<a id="english"></a>

A **boilerplate monorepo** for hosting many static sites (HTML/CSS/JS) on
**AWS (S3 + CloudFront)** with a fully automated **Azure DevOps** CI/CD pipeline,
sourced from **Bitbucket**.

When you change a site, only *that* site is validated, built, deployed to
staging, and — after a manual approval — promoted to production. Cache
invalidations are scoped to the paths that actually changed.

```
Bitbucket (monorepo)  ──►  Azure DevOps Pipelines  ──►  AWS (S3 + CloudFront)
   push / PR                 detect → validate →           per-site buckets
                             build → deploy(staging)        + distributions
                             → approval → deploy(prod)
```

![AWS Fast Deployments — complete CI/CD workflow](docs/workflow.png)

## Repository layout

```
.
├── sites/                    # one folder per static site (the site source)
│   ├── example-site/src/...
│   └── marketing-site/src/...
├── shared/                   # reusable CSS/JS/assets across sites
├── config/
│   ├── sites.json            # ⭐ central registry: site → buckets + distributions
│   └── sites.schema.json
├── infrastructure/           # Terraform IaC
│   ├── modules/static-site/  #   reusable module (1 bucket + 1 distribution)
│   └── environments/         #   staging/ and production/ roots
├── pipelines/
│   ├── azure-pipelines.yml   # main pipeline
│   ├── templates/            # reusable validate/build/deploy blocks
│   └── scripts/              # Node helpers (detect/build/deploy/invalidate/create)
├── package.json
└── README.md                 # you are here
```

Each area has its own README: [`config/`](config/README.md),
[`shared/`](shared/README.md), [`infrastructure/`](infrastructure/README.md),
[`pipelines/`](pipelines/README.md). See also the HTML best-practices &
security checklist in [`docs/html-guidelines.md`](docs/html-guidelines.md).

## How the whole flow works

1. A developer edits files under `sites/<some-site>/src/` and opens a PR in
   Bitbucket.
2. Azure DevOps runs the pipeline. **DetectChanges** diffs the commit and finds
   which sites changed (paths under `sites/`; a `shared/` change rebuilds all).
3. **StagingCI** lints, builds and (on merge to `main`/`develop`) deploys the
   changed sites to their **staging** S3 buckets, then invalidates only the
   affected CloudFront paths.
4. **ProductionCD** waits for a **manual approval** on the `production`
   environment, then deploys the same sites to **production** and invalidates.

The `config/sites.json` registry is the glue: it tells the scripts which bucket
and distribution belong to each site + environment. The Terraform in
`infrastructure/` creates those buckets and distributions.

## Prerequisites

- Node.js >= 18
- Terraform >= 1.5 (for infrastructure)
- An AWS account + credentials
- Azure DevOps organization/project connected to your Bitbucket repo

## Quick start

```bash
# 1. Install tooling
npm ci

# 2. Provision infrastructure (creates buckets + distributions)
cd infrastructure/environments/staging
cp terraform.tfvars.example terraform.tfvars   # edit bucket names
terraform init && terraform apply
terraform output -json sites                    # copy bucket + distribution_id
# ...repeat in infrastructure/environments/production

# 3. Paste the real bucket names + distribution IDs into config/sites.json,
#    replacing the REPLACE-ME placeholders.

# 4. Wire up Azure DevOps (service connection, environments, approval gate)
#    — see pipelines/README.md.

# 5. Push to Bitbucket. The pipeline takes it from there.
```

## Adding a new site

```bash
node pipelines/scripts/create-site.js --name my-new-site \
  --display "My New Site" \
  --bucket-prefix my-org \
  --staging-domain staging.my-new-site.com \
  --prod-domain www.my-new-site.com
```

This will:
1. Scaffold `sites/my-new-site/src/` with starter files.
2. Add a `my-new-site` entry to `config/sites.json` (with placeholders).
3. Print the Terraform `tfvars` snippets to paste into both environments.

Then: add those snippets to the tfvars, `terraform apply` in each environment,
and copy the resulting outputs (bucket + distribution id) back into
`config/sites.json`. Commit and push — the pipeline deploys it.

## Running locally

Every pipeline step is a plain Node script you can run yourself:

```bash
npm run validate:config                                   # validate registry
node pipelines/scripts/detect-changes.js --base origin/main --head HEAD
node pipelines/scripts/build-site.js --site example-site
node pipelines/scripts/deploy-site.js --site example-site --env staging
node pipelines/scripts/invalidate-cloudfront.js --site example-site --env staging
```

Copy `config/.env.example` → `.env` for local AWS credentials. Use `DRY_RUN=true`
to preview deploys without touching AWS. See [`pipelines/README.md`](pipelines/README.md).

## Environments & branching

| Branch / event | What runs |
|----------------|-----------|
| Feature branch **PR** | DetectChanges + validate + build (no deploy). Optional PR previews are a documented extension. |
| Merge to `develop` / `main` | Full pipeline: staging deploy (automatic) → approval → production deploy. |

- **Staging:** automatic deploy of changed sites, no approval.
- **Production:** deploy only after manual approval on the `production`
  Environment in Azure DevOps.

## Versioning & rollback

S3 **object versioning** is enabled on every bucket (via the Terraform module),
and old versions are pruned after 90 days by default. To roll back a site:

- **Redeploy a previous commit:** check out the last-good commit and re-run the
  pipeline (cleanest, since it also re-invalidates CloudFront).
- **Restore object versions:** use S3 versioning to restore prior object
  versions for the affected keys, then invalidate:
  ```bash
  node pipelines/scripts/invalidate-cloudfront.js --site <name> --env production --all
  ```

## Security

- **No secrets in the repo.** AWS access comes from the Azure DevOps AWS service
  connection at runtime; local runs use your own env/profile.
- S3 buckets are **private**; only their CloudFront distribution can read them
  (Origin Access Control + least-privilege bucket policy).
- `.gitignore` excludes `.env`, `*.tfvars`, state files, and credentials.

## Scaling to 20–50 sites

- Sites are data, not code: add a folder + a `sites.json` entry + a tfvars map
  entry. No pipeline or resource duplication.
- The pipeline only processes changed sites, so build times stay flat as the
  number of sites grows.

---

<a id="español"></a>

# AWS Fast Deployments (Español)

**Idioma / Language:** [Español](#español) · [English](#english)

Un **monorepo boilerplate** para alojar muchos sitios estáticos (HTML/CSS/JS) en
**AWS (S3 + CloudFront)** con un pipeline de CI/CD totalmente automatizado en
**Azure DevOps**, con el código fuente en **Bitbucket**.

Cuando modificás un sitio, solo *ese* sitio se valida, se construye, se despliega
a staging y —tras una aprobación manual— se promueve a producción. Las
invalidaciones de caché se limitan a las rutas que realmente cambiaron.

```
Bitbucket (monorepo)  ──►  Azure DevOps Pipelines  ──►  AWS (S3 + CloudFront)
   push / PR                 detectar → validar →         buckets por sitio
                             build → deploy(staging)       + distribuciones
                             → aprobación → deploy(prod)
```

![AWS Fast Deployments — workflow completo de CI/CD](docs/workflow.png)

## Estructura del repositorio

```
.
├── sites/                    # una carpeta por sitio estático (el código fuente)
│   ├── example-site/src/...
│   └── marketing-site/src/...
├── shared/                   # CSS/JS/assets reutilizables entre sitios
├── config/
│   ├── sites.json            # ⭐ registro central: sitio → buckets + distribuciones
│   └── sites.schema.json
├── infrastructure/           # IaC con Terraform
│   ├── modules/static-site/  #   módulo reutilizable (1 bucket + 1 distribución)
│   └── environments/         #   raíces de staging/ y production/
├── pipelines/
│   ├── azure-pipelines.yml   # pipeline principal
│   ├── templates/            # bloques reutilizables validate/build/deploy
│   └── scripts/              # helpers en Node (detect/build/deploy/invalidate/create)
├── package.json
└── README.md                 # estás acá
```

Cada área tiene su propio README: [`config/`](config/README.md),
[`shared/`](shared/README.md), [`infrastructure/`](infrastructure/README.md),
[`pipelines/`](pipelines/README.md). Ver también el checklist de buenas
prácticas y seguridad de HTML en
[`docs/html-guidelines.md`](docs/html-guidelines.md).

## Cómo funciona todo el flujo

1. Una persona desarrolladora edita archivos en `sites/<algún-sitio>/src/` y abre
   un PR en Bitbucket.
2. Azure DevOps ejecuta el pipeline. **DetectChanges** hace un diff del commit y
   detecta qué sitios cambiaron (rutas bajo `sites/`; un cambio en `shared/`
   reconstruye todos).
3. **StagingCI** hace lint, build y (al mergear a `main`/`develop`) despliega los
   sitios modificados a sus buckets S3 de **staging**, y luego invalida solo las
   rutas de CloudFront afectadas.
4. **ProductionCD** espera una **aprobación manual** en el entorno `production` y
   luego despliega los mismos sitios a **producción** e invalida la caché.

El registro `config/sites.json` es el pegamento: le indica a los scripts qué
bucket y qué distribución corresponden a cada sitio + entorno. El Terraform de
`infrastructure/` crea esos buckets y distribuciones.

## Requisitos previos

- Node.js >= 18
- Terraform >= 1.5 (para la infraestructura)
- Una cuenta de AWS + credenciales
- Una organización/proyecto de Azure DevOps conectado a tu repo de Bitbucket

## Inicio rápido

```bash
# 1. Instalar herramientas
npm ci

# 2. Aprovisionar infraestructura (crea buckets + distribuciones)
cd infrastructure/environments/staging
cp terraform.tfvars.example terraform.tfvars   # editar nombres de buckets
terraform init && terraform apply
terraform output -json sites                    # copiar bucket + distribution_id
# ...repetir en infrastructure/environments/production

# 3. Pegar los nombres reales de buckets + IDs de distribución en config/sites.json,
#    reemplazando los placeholders REPLACE-ME.

# 4. Configurar Azure DevOps (service connection, environments, gate de aprobación)
#    — ver pipelines/README.md.

# 5. Hacer push a Bitbucket. El pipeline se encarga del resto.
```

## Agregar un nuevo sitio

```bash
node pipelines/scripts/create-site.js --name my-new-site \
  --display "My New Site" \
  --bucket-prefix my-org \
  --staging-domain staging.my-new-site.com \
  --prod-domain www.my-new-site.com
```

Esto hace lo siguiente:
1. Genera `sites/my-new-site/src/` con archivos iniciales.
2. Agrega una entrada `my-new-site` a `config/sites.json` (con placeholders).
3. Imprime los snippets de `tfvars` de Terraform para pegar en ambos entornos.

Después: agregá esos snippets a los `tfvars`, ejecutá `terraform apply` en cada
entorno y copiá los outputs resultantes (bucket + distribution id) de vuelta en
`config/sites.json`. Hacé commit y push — el pipeline lo despliega.

## Ejecución local

Cada paso del pipeline es un script de Node que podés correr por tu cuenta:

```bash
npm run validate:config                                   # validar registro
node pipelines/scripts/detect-changes.js --base origin/main --head HEAD
node pipelines/scripts/build-site.js --site example-site
node pipelines/scripts/deploy-site.js --site example-site --env staging
node pipelines/scripts/invalidate-cloudfront.js --site example-site --env staging
```

Copiá `config/.env.example` → `.env` para tus credenciales AWS locales. Usá
`DRY_RUN=true` para previsualizar los deploys sin tocar AWS. Ver
[`pipelines/README.md`](pipelines/README.md).

## Entornos y ramas

| Rama / evento | Qué se ejecuta |
|---------------|----------------|
| **PR** de rama de feature | DetectChanges + validar + build (sin deploy). Los previews por PR son una extensión documentada opcional. |
| Merge a `develop` / `main` | Pipeline completo: deploy a staging (automático) → aprobación → deploy a producción. |

- **Staging:** deploy automático de los sitios modificados, sin aprobación.
- **Producción:** deploy solo después de una aprobación manual en el entorno
  `production` de Azure DevOps.

## Versionado y rollback

El **versionado de objetos** de S3 está habilitado en cada bucket (mediante el
módulo de Terraform), y las versiones antiguas se eliminan a los 90 días por
defecto. Para hacer rollback de un sitio:

- **Redesplegar un commit anterior:** hacé checkout del último commit correcto y
  volvé a ejecutar el pipeline (lo más limpio, porque también reinvalida
  CloudFront).
- **Restaurar versiones de objetos:** usá el versionado de S3 para restaurar
  versiones previas de los objetos afectados y luego invalidá:
  ```bash
  node pipelines/scripts/invalidate-cloudfront.js --site <nombre> --env production --all
  ```

## Seguridad

- **Sin secretos en el repo.** El acceso a AWS proviene de la service connection
  de AWS en Azure DevOps en tiempo de ejecución; las corridas locales usan tu
  propio entorno/perfil.
- Los buckets S3 son **privados**; solo su distribución de CloudFront puede
  leerlos (Origin Access Control + policy de bucket con mínimo privilegio).
- `.gitignore` excluye `.env`, `*.tfvars`, archivos de state y credenciales.

## Escalar a 20–50 sitios

- Los sitios son datos, no código: agregás una carpeta + una entrada en
  `sites.json` + una entrada en el mapa de `tfvars`. Sin duplicar pipeline ni
  recursos.
- El pipeline solo procesa los sitios modificados, así que los tiempos de build
  se mantienen estables a medida que crece la cantidad de sitios.
