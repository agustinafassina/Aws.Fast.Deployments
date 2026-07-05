#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  CloudFrontClient,
  CreateInvalidationCommand,
} = require("@aws-sdk/client-cloudfront");
const { getSite, getEnvironment, REPO_ROOT } = require("./lib/config");
const { parseArgs, log, isDryRun } = require("./lib/util");

// Above this count, a wildcard is cheaper/simpler than individual paths.
const MAX_INDIVIDUAL_PATHS = 30;

function readChangedPaths(site, environment) {
  const artifact = path.join(
    REPO_ROOT,
    ".artifacts",
    `${site.name}-${environment}-changed.json`
  );
  if (!fs.existsSync(artifact)) return null;
  try {
    const arr = JSON.parse(fs.readFileSync(artifact, "utf8"));
    return Array.isArray(arr) ? arr : null;
  } catch {
    return null;
  }
}

function computeInvalidationPaths(changed, forceAll) {
  if (forceAll) return ["/*"];
  if (!changed || changed.length === 0) return ["/*"];

  const set = new Set();
  for (const p of changed) {
    set.add(p);
    // For HTML files, also invalidate the "pretty" path (directory) it backs.
    if (p.endsWith("/index.html")) {
      set.add(p.replace(/index\.html$/, "")); // "/dir/"
    } else if (p === "/index.html") {
      set.add("/");
    }
  }
  const paths = [...set];
  if (paths.length > MAX_INDIVIDUAL_PATHS) {
    log.warn(`${paths.length} paths changed (> ${MAX_INDIVIDUAL_PATHS}); using "/*" wildcard.`);
    return ["/*"];
  }
  return paths;
}

async function main() {
  const args = parseArgs();
  const environment = args.env || process.env.DEPLOY_ENV;
  if (!args.site) throw new Error("Provide --site <name>");
  if (!environment) throw new Error("Provide --env <staging|production>");

  const site = getSite(args.site);
  const env = getEnvironment(site, environment);
  const dryRun = isDryRun(args);
  const region = site.awsRegion || process.env.AWS_REGION || "us-east-1";

  const distributionId = env.distributionId;
  if (!distributionId || distributionId.startsWith("REPLACE")) {
    throw new Error(
      `Site "${site.name}" (${environment}) has no valid distributionId in config/sites.json.`
    );
  }

  let paths;
  if (args.paths) {
    paths = String(args.paths).split(",").map((s) => s.trim()).filter(Boolean);
  } else {
    const changed = readChangedPaths(site, environment);
    paths = computeInvalidationPaths(changed, args.all === true);
  }

  log.step(`Invalidating ${site.name} (${environment}) dist ${distributionId}`);
  log.info(`Paths (${paths.length}): ${paths.join(", ")}`);
  if (dryRun) {
    log.warn("DRY RUN — no invalidation created.");
    return;
  }

  const cf = new CloudFrontClient({ region });
  const res = await cf.send(
    new CreateInvalidationCommand({
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: `${site.name}-${environment}-${Date.now()}`,
        Paths: { Quantity: paths.length, Items: paths },
      },
    })
  );
  log.info(`Invalidation created: ${res.Invalidation?.Id} (status: ${res.Invalidation?.Status})`);
}

if (require.main === module) {
  main().catch((err) => {
    log.error(err.message);
    process.exit(1);
  });
}

module.exports = { main, computeInvalidationPaths };
