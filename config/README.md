# `config/` — Central site registry

**Language / Idioma:** [English](#english) · [Español](#español)

<a id="english"></a>

This folder is the **single source of truth** that connects a site's source code
to its AWS hosting resources. Both the Azure DevOps pipeline and the helper
scripts read `sites.json` to know *what* to build and *where* to deploy.

## Files

| File | Purpose |
|------|---------|
| `sites.json` | The registry: one entry per static site with its S3 buckets and CloudFront distribution IDs per environment. |
| `sites.schema.json` | JSON Schema that validates `sites.json`. Editors that understand `$schema` will autocomplete and lint the file. |
| `.env.example` | Sample environment variables for running the scripts locally. Copy to `.env` (git-ignored). |

## `sites.json` structure

```jsonc
{
  "defaults": {              // optional, applied to every site unless overridden
    "buildCommand": "",
    "outputDir": "src",
    "awsRegion": "us-east-1"
  },
  "sites": [
    {
      "name": "example-site",          // internal id — MUST equal the folder in sites/
      "displayName": "Example Landing", // human-friendly name
      "sourceDir": "sites/example-site",
      "outputDir": "dist",             // folder (inside sourceDir) with deployable files
      "buildCommand": "node ...",      // "" => deploy sourceDir/src directly, no build
      "environments": {
        "staging":    { "bucket": "...", "distributionId": "...", "domain": "..." },
        "production": { "bucket": "...", "distributionId": "...", "domain": "..." }
      }
    }
  ]
}
```

## How values flow through the system

1. **`terraform apply`** (in `infrastructure/`) creates the S3 buckets and
   CloudFront distributions and **outputs** the real bucket names and
   distribution IDs.
2. You paste those outputs into `sites.json` (replacing the `REPLACE-ME`
   placeholders). The `create-site` script can do the first insertion for you.
3. The **pipeline** and **scripts** read `sites.json` to deploy the right files
   to the right bucket and invalidate the right distribution.

## Validation

Validate the file at any time:

```bash
npm run validate:config
```

The pipeline runs this automatically before doing anything else, so a malformed
config fails fast instead of deploying to the wrong place.

## Security note

`sites.json` contains only **non-secret** identifiers (bucket names, distribution
IDs, domains). No credentials belong here. AWS access is provided at runtime via
the Azure DevOps AWS service connection or local environment variables.

---

<a id="español"></a>

# `config/` — Registro central de sitios

**Idioma / Language:** [Español](#español) · [English](#english)

Esta carpeta es la **fuente única de verdad** que conecta el código fuente de
cada sitio con sus recursos de hosting en AWS. Tanto el pipeline de Azure DevOps
como los scripts auxiliares leen `sites.json` para saber *qué* construir y
*dónde* desplegar.

## Archivos

| Archivo | Propósito |
|---------|-----------|
| `sites.json` | El registro: una entrada por sitio estático con sus buckets S3 e IDs de distribución CloudFront por entorno. |
| `sites.schema.json` | JSON Schema que valida `sites.json`. Los editores que entienden `$schema` autocompletan y validan el archivo. |
| `.env.example` | Variables de entorno de ejemplo para ejecutar los scripts localmente. Copiar a `.env` (git-ignored). |

## Estructura de `sites.json`

```jsonc
{
  "defaults": {              // opcional, se aplica a cada sitio salvo override
    "buildCommand": "",
    "outputDir": "src",
    "awsRegion": "us-east-1"
  },
  "sites": [
    {
      "name": "example-site",          // id interno — DEBE coincidir con la carpeta en sites/
      "displayName": "Example Landing", // nombre legible
      "sourceDir": "sites/example-site",
      "outputDir": "dist",             // carpeta (dentro de sourceDir) con archivos desplegables
      "buildCommand": "node ...",      // "" => desplegar sourceDir/src directo, sin build
      "environments": {
        "staging":    { "bucket": "...", "distributionId": "...", "domain": "..." },
        "production": { "bucket": "...", "distributionId": "...", "domain": "..." }
      }
    }
  ]
}
```

## Cómo fluyen los valores en el sistema

1. **`terraform apply`** (en `infrastructure/`) crea los buckets S3 y las
   distribuciones CloudFront y **devuelve** los nombres reales de buckets e IDs
   de distribución.
2. Pegás esos outputs en `sites.json` (reemplazando los placeholders
   `REPLACE-ME`). El script `create-site` puede hacer la primera inserción por vos.
3. El **pipeline** y los **scripts** leen `sites.json` para desplegar los
   archivos correctos al bucket correcto e invalidar la distribución correcta.

## Validación

Validá el archivo en cualquier momento:

```bash
npm run validate:config
```

El pipeline lo ejecuta automáticamente antes de cualquier otra cosa, así un
config mal formado falla rápido en lugar de desplegar al lugar equivocado.

## Nota de seguridad

`sites.json` contiene solo identificadores **no secretos** (nombres de buckets,
IDs de distribución, dominios). No van credenciales acá. El acceso a AWS se
provee en tiempo de ejecución vía la service connection de AWS en Azure DevOps o
variables de entorno locales.
