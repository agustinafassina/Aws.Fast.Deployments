#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const mime = require("mime-types");
const {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectsCommand,
} = require("@aws-sdk/client-s3");
const { getSite, getEnvironment, REPO_ROOT } = require("./lib/config");
const { parseArgs, log, isDryRun } = require("./lib/util");

const LONG_CACHE = "public, max-age=31536000, immutable";
const NO_CACHE = "public, max-age=0, must-revalidate";
const IMMUTABLE_EXT = new Set([
  ".css", ".js", ".mjs", ".png", ".jpg", ".jpeg", ".gif", ".webp",
  ".svg", ".ico", ".woff", ".woff2", ".ttf", ".otf", ".mp4", ".webm",
]);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });
}

function md5(buf) {
  return crypto.createHash("md5").update(buf).digest("hex");
}

function cacheControlFor(key) {
  const ext = path.extname(key).toLowerCase();
  if (ext === ".html" || key.endsWith("/")) return NO_CACHE;
  return IMMUTABLE_EXT.has(ext) ? LONG_CACHE : NO_CACHE;
}

async function listRemote(s3, bucket) {
  const map = new Map(); // key -> etag (md5 for non-multipart)
  let token;
  do {
    const res = await s3.send(
      new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token })
    );
    for (const obj of res.Contents || []) {
      map.set(obj.Key, (obj.ETag || "").replace(/"/g, ""));
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return map;
}

async function main() {
  const args = parseArgs();
  const environment = args.env || process.env.DEPLOY_ENV;
  if (!args.site) throw new Error("Provide --site <name>");
  if (!environment) throw new Error("Provide --env <staging|production>");

  const site = getSite(args.site);
  const env = getEnvironment(site, environment);
  const dryRun = isDryRun(args);

  const bucket = env.bucket;
  const region = site.awsRegion || process.env.AWS_REGION || "us-east-1";

  const srcDir = path.join(
    REPO_ROOT,
    site.sourceDir,
    site.outputDir && site.outputDir !== "src" ? site.outputDir : "src"
  );
  if (!fs.existsSync(srcDir)) {
    throw new Error(`Nothing to deploy: ${srcDir} does not exist. Did the build run?`);
  }

  log.step(`Deploying "${site.name}" -> ${environment} (bucket: ${bucket}, region: ${region})`);
  if (dryRun) log.warn("DRY RUN — no changes will be made.");

  const s3 = new S3Client({ region });
  const remote = dryRun ? new Map() : await listRemote(s3, bucket);

  const localFiles = walk(srcDir);
  const localKeys = new Set();
  const changedKeys = [];

  for (const file of localFiles) {
    const key = path.relative(srcDir, file).split(path.sep).join("/");
    localKeys.add(key);
    const body = fs.readFileSync(file);
    const hash = md5(body);

    if (remote.get(key) === hash) {
      continue; // unchanged
    }

    changedKeys.push("/" + key);
    const contentType = mime.lookup(file) || "application/octet-stream";
    const cacheControl = cacheControlFor(key);

    log.info(`  upload ${key} (${contentType}, ${cacheControl})`);
    if (!dryRun) {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          CacheControl: cacheControl,
        })
      );
    }
  }

  // Delete remote objects no longer present locally.
  const toDelete = [...remote.keys()].filter((k) => !localKeys.has(k));
  if (toDelete.length) {
    log.info(`  deleting ${toDelete.length} stale object(s)`);
    changedKeys.push(...toDelete.map((k) => "/" + k));
    if (!dryRun) {
      // DeleteObjects handles max 1000 keys per call.
      for (let i = 0; i < toDelete.length; i += 1000) {
        await s3.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: toDelete.slice(i, i + 1000).map((Key) => ({ Key })) },
          })
        );
      }
    }
  }

  log.info(`Deploy complete: ${changedKeys.length} object(s) changed.`);

  // Persist changed paths so the invalidation step can scope itself.
  const artifactsDir = path.join(REPO_ROOT, ".artifacts");
  fs.mkdirSync(artifactsDir, { recursive: true });
  const artifact = path.join(artifactsDir, `${site.name}-${environment}-changed.json`);
  fs.writeFileSync(artifact, JSON.stringify(changedKeys));
  log.info(`Wrote changed paths -> ${artifact}`);
}

if (require.main === module) {
  main().catch((err) => {
    log.error(err.message);
    process.exit(1);
  });
}

module.exports = { main };
