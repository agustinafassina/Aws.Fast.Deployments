#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { loadConfig, REPO_ROOT } = require("./lib/config");
const { log } = require("./lib/util");

function main() {
  const { sites, configPath } = loadConfig();
  const errors = [];
  const warnings = [];
  const seen = new Set();

  if (sites.length === 0) warnings.push("No sites defined.");

  for (const site of sites) {
    const id = site.name || "(unnamed)";
    if (!site.name) errors.push(`A site is missing "name".`);
    else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(site.name))
      errors.push(`Site "${id}" name must be kebab-case (lowercase, hyphens).`);
    if (seen.has(site.name)) errors.push(`Duplicate site name "${site.name}".`);
    seen.add(site.name);

    if (!site.sourceDir) {
      errors.push(`Site "${id}" is missing "sourceDir".`);
    } else if (!fs.existsSync(path.join(REPO_ROOT, site.sourceDir))) {
      errors.push(`Site "${id}" sourceDir does not exist: ${site.sourceDir}`);
    }

    for (const envName of ["staging", "production"]) {
      const env = site.environments && site.environments[envName];
      if (!env) {
        errors.push(`Site "${id}" is missing environment "${envName}".`);
        continue;
      }
      if (!env.bucket) errors.push(`Site "${id}" (${envName}) missing "bucket".`);
      if (!env.distributionId) errors.push(`Site "${id}" (${envName}) missing "distributionId".`);
      if (env.bucket && /REPLACE/i.test(env.bucket))
        warnings.push(`Site "${id}" (${envName}) bucket still has a placeholder value.`);
      if (env.distributionId && /REPLACE/i.test(env.distributionId))
        warnings.push(`Site "${id}" (${envName}) distributionId still has a placeholder value.`);
    }
  }

  log.info(`Validated ${sites.length} site(s) from ${configPath}`);
  warnings.forEach((w) => log.warn(w));

  if (errors.length) {
    errors.forEach((e) => log.error(e));
    log.error(`Config invalid: ${errors.length} error(s).`);
    process.exit(1);
  }
  log.info("Config OK.");
}

if (require.main === module) main();
