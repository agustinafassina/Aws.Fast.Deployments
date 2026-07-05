#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { loadConfig, getConfigPath, REPO_ROOT } = require("./lib/config");
const { parseArgs, log } = require("./lib/util");

function assertKebab(name) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
    throw new Error(`--name must be kebab-case (lowercase letters, numbers, hyphens). Got "${name}".`);
  }
}

function writeIfAbsent(file, content) {
  if (fs.existsSync(file)) {
    log.warn(`Exists, skipping: ${path.relative(REPO_ROOT, file)}`);
    return;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  log.info(`Created ${path.relative(REPO_ROOT, file)}`);
}

function siteReadmeTemplate(name, displayName) {
  return `# 🌐 ${name}

**Language / Idioma:** [English](#english) · [Español](#español)

<a id="english"></a>

## About

| Field | Value |
|-------|-------|
| **Purpose** | _What this site is for — replace_ |
| **Audience** | _Who visits this site — replace_ |
| **Version** | \`1.0.0\` |
| **Owner** | _Business owner (team/person) — replace_ |
| **Maintainer** | _Technical maintainer (team/person) — replace_ |
| **Review contact** | _@team to tag on PRs — replace_ |
| **Escalation** | _Email/contact for production incidents — replace_ |

## Domains

| Environment | URL |
|-------------|-----|
| Staging | _see config/sites.json_ |
| Production | _see config/sites.json_ |

## Structure

\`\`\`
${name}/
├── src/
│   ├── index.html
│   ├── css/style.css
│   └── js/main.js
└── README.md
\`\`\`

## Local preview

\`\`\`bash
npx serve sites/${name}/src
\`\`\`

## Checklist

Before merging: [docs/site-checklist.md](../../docs/site-checklist.md) · [docs/html-guidelines.md](../../docs/html-guidelines.md)

---

<a id="español"></a>

## Acerca de

| Campo | Valor |
|-------|-------|
| **Propósito** | _Para qué sirve este sitio — reemplazar_ |
| **Audiencia** | _Quién lo visita — reemplazar_ |
| **Versión** | \`1.0.0\` |
| **Owner** | _Responsable de negocio — reemplazar_ |
| **Maintainer** | _Responsable técnico — reemplazar_ |
| **Contacto de revisión** | _@equipo para PRs — reemplazar_ |
| **Escalación** | _Email/contacto incidentes producción — reemplazar_ |

## Dominios

Ver \`config/sites.json\`.

## Vista previa local

\`\`\`bash
npx serve sites/${name}/src
\`\`\`

## Checklist

Antes de mergear: [docs/site-checklist.md](../../docs/site-checklist.md) · [docs/html-guidelines.md](../../docs/html-guidelines.md)
`;
}

function scaffoldFiles(name, displayName) {
  const base = path.join(REPO_ROOT, "sites", name);
  writeIfAbsent(
    path.join(base, "src", "index.html"),
    `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${displayName}</title>
    <meta name="description" content="${displayName}" />
    <link rel="stylesheet" href="./css/style.css" />
  </head>
  <body>
    <main>
      <h1>${displayName}</h1>
      <p>New site scaffolded by create-site.js.</p>
    </main>
    <script type="module" src="./js/main.js"></script>
  </body>
</html>
`
  );
  writeIfAbsent(
    path.join(base, "src", "css", "style.css"),
    `body {\n  font-family: system-ui, sans-serif;\n  margin: 2rem;\n}\n`
  );
  writeIfAbsent(
    path.join(base, "src", "js", "main.js"),
    `console.log("${name} loaded");\n`
  );
  writeIfAbsent(
    path.join(base, "README.md"),
    siteReadmeTemplate(name, displayName)
  );
}

function updateConfig(name, displayName, opts) {
  const configPath = getConfigPath();
  const raw = JSON.parse(fs.readFileSync(configPath, "utf8"));
  raw.sites = raw.sites || [];

  if (raw.sites.some((s) => s.name === name)) {
    log.warn(`Site "${name}" already in config; not adding a duplicate.`);
    return { stagingBucket: null, prodBucket: null };
  }

  const prefix = opts.bucketPrefix ? `${opts.bucketPrefix}-` : "";
  const stagingBucket = `${prefix}${name}-staging`;
  const prodBucket = `${prefix}${name}-prod`;

  raw.sites.push({
    name,
    displayName,
    description: "",
    sourceDir: `sites/${name}`,
    outputDir: "dist",
    buildCommand: `node ../../pipelines/scripts/build-site.js --site ${name}`,
    environments: {
      staging: {
        bucket: stagingBucket,
        distributionId: "REPLACE_WITH_STAGING_DIST_ID",
        domain: opts.stagingDomain || "",
      },
      production: {
        bucket: prodBucket,
        distributionId: "REPLACE_WITH_PROD_DIST_ID",
        domain: opts.prodDomain || "",
      },
    },
  });

  fs.writeFileSync(configPath, JSON.stringify(raw, null, 2) + "\n");
  log.info(`Updated ${path.relative(REPO_ROOT, configPath)} with "${name}".`);
  return { stagingBucket, prodBucket };
}

function printTfvarsSnippet(name, buckets, opts) {
  if (!buckets.stagingBucket) return;
  log.step("Next: add these entries to staging.tfvars and production.tfvars, then apply each workspace.");
  console.log(`
# infrastructure/deployments/staging.tfvars (sites map)
  "${name}" = {
    bucket_name = "${buckets.stagingBucket}"${opts.stagingDomain ? `\n    domains     = ["${opts.stagingDomain}"]` : ""}
  }

# infrastructure/deployments/production.tfvars (sites map)
  "${name}" = {
    bucket_name = "${buckets.prodBucket}"${opts.prodDomain ? `\n    domains     = ["${opts.prodDomain}"]` : ""}
  }

# Then:
#   terraform workspace select staging  && terraform apply -var-file=staging.tfvars
#   terraform workspace select production && terraform apply -var-file=production.tfvars
`);
  log.info("After apply, copy the terraform outputs (bucket + distribution_id) into config/sites.json.");
}

function main() {
  const args = parseArgs();
  const name = args.name;
  if (!name) throw new Error("Provide --name <site-name>");
  assertKebab(name);

  // Ensure config exists / is loadable.
  loadConfig();

  const displayName = args.display || name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const opts = {
    bucketPrefix: args["bucket-prefix"] || "",
    stagingDomain: args["staging-domain"] || "",
    prodDomain: args["prod-domain"] || "",
  };

  scaffoldFiles(name, displayName);
  const buckets = updateConfig(name, displayName, opts);
  printTfvarsSnippet(name, buckets, opts);

  log.step(`Done. New site "${name}" scaffolded.`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    log.error(err.message);
    process.exit(1);
  }
}

module.exports = { main };
