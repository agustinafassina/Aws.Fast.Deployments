# 🔄 `pipelines/` — Azure DevOps CI/CD

**Language / Idioma:** [English](#english) · [Español](#español)

<a id="english"></a>

```
pipelines/
├── azure-pipelines.yml     # the main pipeline (entry point)
├── templates/              # reusable YAML step blocks
│   ├── setup.yml           #   Node + npm ci
│   ├── validate.yml        #   lint changed sites (HTML/CSS/JS)
│   ├── build.yml           #   build/optimize changed sites
│   └── deploy.yml          #   deploy to S3 + invalidate CloudFront
└── scripts/                # Node helper scripts (also usable locally)
    ├── detect-changes.js
    ├── build-site.js
    ├── deploy-site.js
    ├── invalidate-cloudfront.js
    ├── create-site.js
    ├── validate-config.js
    └── lib/{config,util}.js
```

## Pipeline flow

```
push / PR (Bitbucket) ──► Azure DevOps pipeline
        │
        ├─ Stage 1: DetectChanges
        │     validate config, git-diff to find changed sites → `changedSites`
        │
        ├─ Stage 2: StagingCI   (runs if changedSites ≠ [])
        │     validate → build → deploy to STAGING (branch `develop` only) → invalidate
        │
        └─ Stage 3: ProductionCD (branch `master` only, needs approval)
              ⛔ MANUAL APPROVAL on the `production` Environment
              build → deploy to PRODUCTION → invalidate
```

Branch model: **`develop` → staging** (automatic), **`master` → production**
(after manual approval).

Only the sites that actually changed are validated, built, deployed and
invalidated. A change under `shared/` or to `config/sites.json` rebuilds all
sites (see `shared/README.md`).

## One-time Azure DevOps setup

1. **Install the AWS Toolkit extension**
   Install *"AWS Toolkit for Azure DevOps"* from the Marketplace into your
   organization. It provides the `AWSShellScript@1` task used by `deploy.yml`.

2. **Create an AWS service connection**
   Project Settings → *Service connections* → *New* → **AWS**.
   Name it **`aws-static-sites`** (matches the `awsServiceConnection` variable in
   `azure-pipelines.yml`). Use an IAM user/role scoped to:
   - `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket` on the site buckets
   - `cloudfront:CreateInvalidation` on the distributions
   Prefer short-lived credentials / OIDC where possible. **No keys go in the repo.**

3. **Create the pipeline from Bitbucket**
   Pipelines → *New pipeline* → **Bitbucket Cloud** → pick the monorepo →
   *Existing YAML file* → `/pipelines/azure-pipelines.yml`.
   (Authorize the Bitbucket ↔ Azure DevOps connection when prompted.)

4. **Create Environments + approval gate**
   Pipelines → *Environments* → create **`production`** (and optionally
   `staging`). On `production`, add an **Approvals and checks → Approvals** entry
   with the approvers who may promote to prod. This is the manual gate.

5. **(Optional) Variable group / overrides**
   Override `awsServiceConnection`, `awsRegion`, or `SHARED_AFFECTS_ALL` via a
   variable group if your naming differs.

## Bitbucket integration notes

- Azure DevOps can build **Bitbucket Cloud** repos directly. When you create the
  pipeline it registers a webhook in Bitbucket so pushes/PRs trigger builds.
- `trigger:` (branch pushes) and `pr:` (pull requests) in `azure-pipelines.yml`
  control which events run. PRs run validation/build only; a push/merge to
  `develop` deploys to staging and a push/merge to `master` deploys to production.

## Change detection details

`detect-changes.js` diffs the current commit against a base:
- **PR builds:** base = the PR target branch (`SYSTEM_PULLREQUEST_TARGETBRANCH`).
- **Push builds:** base = previous commit (`HEAD~1`).
Override manually with `--base <ref> --head <ref>`. It emits the Azure DevOps
output variable `changedSites` (a JSON array) consumed by later stages.

## Running the steps locally

```bash
npm ci
cp config/.env.example .env          # fill in AWS creds, then `source .env`

# What changed vs develop?
node pipelines/scripts/detect-changes.js --base origin/develop --head HEAD

# Validate config + lint + build one site
npm run validate:config
npx htmlhint "sites/example-site/src/**/*.html"
node pipelines/scripts/build-site.js --site example-site

# Deploy + invalidate (uses your local AWS creds)
node pipelines/scripts/deploy-site.js --site example-site --env staging
node pipelines/scripts/invalidate-cloudfront.js --site example-site --env staging

# Dry run (no AWS calls)
DRY_RUN=true node pipelines/scripts/deploy-site.js --site example-site --env staging
```

## Future / optional: PR previews

A natural extension is per-PR preview environments (e.g. deploy changed sites to
a `preview/<PR-id>/<site>/` prefix in the staging bucket and comment the URL on
the Bitbucket PR). Left as a documented extension point; the current pipeline
runs validation/build on PRs but does not deploy previews.

---

<a id="español"></a>

# 🔄 `pipelines/` — CI/CD con Azure DevOps

**Idioma / Language:** [Español](#español) · [English](#english)

```
pipelines/
├── azure-pipelines.yml     # pipeline principal (punto de entrada)
├── templates/              # bloques YAML reutilizables
│   ├── setup.yml           #   Node + npm ci
│   ├── validate.yml        #   lint de sitios modificados (HTML/CSS/JS)
│   ├── build.yml           #   build/optimización de sitios modificados
│   └── deploy.yml          #   deploy a S3 + invalidación CloudFront
└── scripts/                # scripts auxiliares en Node (también usables localmente)
    ├── detect-changes.js
    ├── build-site.js
    ├── deploy-site.js
    ├── invalidate-cloudfront.js
    ├── create-site.js
    ├── validate-config.js
    └── lib/{config,util}.js
```

## Flujo del pipeline

```
push / PR (Bitbucket) ──► pipeline de Azure DevOps
        │
        ├─ Etapa 1: DetectChanges
        │     validar config, git-diff para sitios modificados → `changedSites`
        │
        ├─ Etapa 2: StagingCI   (corre si changedSites ≠ [])
        │     validar → build → deploy a STAGING (solo rama `develop`) → invalidar
        │
        └─ Etapa 3: ProductionCD (solo rama `master`, requiere aprobación)
              ⛔ APROBACIÓN MANUAL en el Environment `production`
              build → deploy a PRODUCCIÓN → invalidar
```

Modelo de ramas: **`develop` → staging** (automático), **`master` → producción**
(tras aprobación manual).

Solo los sitios que realmente cambiaron se validan, construyen, despliegan e
invalidan. Un cambio bajo `shared/` o en `config/sites.json` reconstruye todos
los sitios (ver `shared/README.md`).

## Configuración única en Azure DevOps

1. **Instalar la extensión AWS Toolkit**
   Instalá *"AWS Toolkit for Azure DevOps"* desde el Marketplace en tu
   organización. Provee la tarea `AWSShellScript@1` usada por `deploy.yml`.

2. **Crear una service connection de AWS**
   Project Settings → *Service connections* → *New* → **AWS**.
   Nombrala **`aws-static-sites`** (coincide con la variable `awsServiceConnection`
   en `azure-pipelines.yml`). Usá un usuario/rol IAM con permisos para:
   - `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket` en los buckets de sitios
   - `cloudfront:CreateInvalidation` en las distribuciones
   Preferí credenciales de corta duración / OIDC. **Ninguna key va en el repo.**

3. **Crear el pipeline desde Bitbucket**
   Pipelines → *New pipeline* → **Bitbucket Cloud** → elegí el monorepo →
   *Existing YAML file* → `/pipelines/azure-pipelines.yml`.
   (Autorizá la conexión Bitbucket ↔ Azure DevOps cuando lo pida.)

4. **Crear Environments + gate de aprobación**
   Pipelines → *Environments* → creá **`production`** (y opcionalmente
   `staging`). En `production`, agregá **Approvals and checks → Approvals** con
   los aprobadores que pueden promover a prod. Este es el gate manual.

5. **(Opcional) Variable group / overrides**
   Sobrescribí `awsServiceConnection`, `awsRegion` o `SHARED_AFFECTS_ALL` vía un
   variable group si tu nomenclatura difiere.

## Notas de integración con Bitbucket

- Azure DevOps puede construir repos de **Bitbucket Cloud** directamente. Al
  crear el pipeline registra un webhook en Bitbucket para que pushes/PRs
  disparen builds.
- `trigger:` (pushes) y `pr:` (pull requests) en `azure-pipelines.yml` controlan
  qué eventos corren. Los PRs solo validan/build; un push/merge a `develop`
  despliega a staging y un push/merge a `master` despliega a producción.

## Detalles de detección de cambios

`detect-changes.js` hace diff del commit actual contra una base:
- **Builds de PR:** base = rama destino del PR (`SYSTEM_PULLREQUEST_TARGETBRANCH`).
- **Builds de push:** base = commit anterior (`HEAD~1`).
Podés sobrescribir manualmente con `--base <ref> --head <ref>`. Emite la variable
de salida de Azure DevOps `changedSites` (array JSON) consumida por etapas
posteriores.

## Ejecutar los pasos localmente

```bash
npm ci
cp config/.env.example .env          # completar credenciales AWS, luego `source .env`

# ¿Qué cambió vs develop?
node pipelines/scripts/detect-changes.js --base origin/develop --head HEAD

# Validar config + lint + build de un sitio
npm run validate:config
npx htmlhint "sites/example-site/src/**/*.html"
node pipelines/scripts/build-site.js --site example-site

# Deploy + invalidar (usa tus credenciales AWS locales)
node pipelines/scripts/deploy-site.js --site example-site --env staging
node pipelines/scripts/invalidate-cloudfront.js --site example-site --env staging

# Dry run (sin llamadas a AWS)
DRY_RUN=true node pipelines/scripts/deploy-site.js --site example-site --env staging
```

## Futuro / opcional: previews por PR

Una extensión natural son entornos de preview por PR (ej. desplegar sitios
modificados a un prefijo `preview/<PR-id>/<site>/` en el bucket de staging y
comentar la URL en el PR de Bitbucket). Queda como punto de extensión documentado;
el pipeline actual valida/build en PRs pero no despliega previews.
