#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { loadConfig, getSite, REPO_ROOT } = require("./lib/config");
const { parseArgs, log } = require("./lib/util");

function tryRequire(name) {
  try {
    return require(name);
  } catch {
    return null;
  }
}

const htmlMinifier = tryRequire("html-minifier-terser");
const CleanCSS = tryRequire("clean-css");
const terser = tryRequire("terser");

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });
}

async function transform(srcFile) {
  const ext = path.extname(srcFile).toLowerCase();
  const content = fs.readFileSync(srcFile);

  try {
    if (ext === ".html" && htmlMinifier) {
      return Buffer.from(
        await htmlMinifier.minify(content.toString("utf8"), {
          collapseWhitespace: true,
          removeComments: true,
          minifyCSS: true,
          minifyJS: true,
        })
      );
    }
    if (ext === ".css" && CleanCSS) {
      const out = new CleanCSS({ level: 2 }).minify(content.toString("utf8"));
      if (out.errors.length === 0) return Buffer.from(out.styles);
    }
    if (ext === ".js" && terser) {
      const out = await terser.minify(content.toString("utf8"));
      if (out.code) return Buffer.from(out.code);
    }
  } catch (err) {
    log.warn(`Minify failed for ${srcFile} (${err.message}); copying unchanged.`);
  }
  return content;
}

async function buildSite(site) {
  const srcDir = path.join(REPO_ROOT, site.sourceDir, "src");
  const outDir = path.join(REPO_ROOT, site.sourceDir, site.outputDir);

  if (!fs.existsSync(srcDir)) {
    throw new Error(`Source dir not found: ${srcDir}`);
  }

  log.step(`Building "${site.name}": ${srcDir} -> ${outDir}`);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const files = walk(srcDir);
  for (const file of files) {
    const rel = path.relative(srcDir, file);
    const dest = path.join(outDir, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, await transform(file));
  }
  log.info(`Built ${files.length} file(s) for "${site.name}".`);
}

async function main() {
  const args = parseArgs();
  let targets;
  if (args.all) {
    targets = loadConfig().sites;
  } else if (args.site) {
    targets = [getSite(args.site)];
  } else {
    throw new Error("Provide --site <name> or --all");
  }
  for (const site of targets) {
    // Skip sites whose outputDir equals src (deploy-as-is, no build).
    if (site.outputDir === "src" || !site.outputDir) {
      log.info(`Site "${site.name}" has no build step (outputDir=src); skipping.`);
      continue;
    }
    await buildSite(site);
  }
}

if (require.main === module) {
  main().catch((err) => {
    log.error(err.message);
    process.exit(1);
  });
}

module.exports = { buildSite };
