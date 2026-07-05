"use strict";

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");

function getConfigPath() {
  const fromEnv = process.env.SITES_CONFIG;
  return fromEnv
    ? path.resolve(REPO_ROOT, fromEnv)
    : path.join(REPO_ROOT, "config", "sites.json");
}

function loadConfig() {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config not found at ${configPath}`);
  }

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (err) {
    throw new Error(`Failed to parse ${configPath}: ${err.message}`);
  }

  const defaults = raw.defaults || {};
  const sites = (raw.sites || []).map((site) => ({
    buildCommand: defaults.buildCommand ?? "",
    outputDir: defaults.outputDir ?? "src",
    awsRegion: defaults.awsRegion ?? process.env.AWS_REGION ?? "us-east-1",
    ...site,
  }));

  const byName = new Map(sites.map((s) => [s.name, s]));
  return { defaults, sites, byName, configPath };
}

/** Get a single site config or throw. */
function getSite(name) {
  const { byName } = loadConfig();
  const site = byName.get(name);
  if (!site) {
    throw new Error(
      `Site "${name}" not found in config. Known sites: ${[...byName.keys()].join(", ") || "(none)"}`
    );
  }
  return site;
}

/** Resolve environment block (staging|production) for a site, throwing on misuse. */
function getEnvironment(site, environment) {
  if (!["staging", "production"].includes(environment)) {
    throw new Error(`Invalid environment "${environment}". Use "staging" or "production".`);
  }
  const env = site.environments && site.environments[environment];
  if (!env) {
    throw new Error(`Site "${site.name}" has no "${environment}" environment configured.`);
  }
  return env;
}

module.exports = { REPO_ROOT, loadConfig, getSite, getEnvironment, getConfigPath };
