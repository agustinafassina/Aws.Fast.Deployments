#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { loadConfig, REPO_ROOT } = require("./lib/config");
const { parseArgs, log } = require("./lib/util");

function git(args) {
  return execFileSync("git", args, { cwd: REPO_ROOT, encoding: "utf8" }).trim();
}

function refExists(ref) {
  try {
    git(["rev-parse", "--verify", "--quiet", ref]);
    return true;
  } catch {
    return false;
  }
}

/** Figure out base and head refs, preferring explicit args, then CI vars. */
function resolveRefs(args) {
  let head = args.head || process.env.HEAD_REF || "HEAD";

  let base = args.base || process.env.BASE_REF;

  // Azure DevOps PR builds expose the target branch.
  if (!base && process.env.SYSTEM_PULLREQUEST_TARGETBRANCH) {
    base = process.env.SYSTEM_PULLREQUEST_TARGETBRANCH.replace("refs/heads/", "origin/");
  }
  // CI push builds: compare against the previous commit on the branch.
  if (!base) {
    base = `${head}~1`;
  }

  if (!refExists(base)) {
    log.warn(`Base ref "${base}" not found; falling back to HEAD~1 or empty tree.`);
    base = refExists("HEAD~1")
      ? "HEAD~1"
      : git(["hash-object", "-t", "tree", "/dev/null"]).trim(); // empty tree
  }
  return { base, head };
}

function getChangedFiles(base, head) {
  const out = git(["diff", "--name-only", `${base}...${head}`]);
  return out ? out.split("\n").filter(Boolean) : [];
}

function main() {
  const args = parseArgs();
  const { sites } = loadConfig();
  const { base, head } = resolveRefs(args);

  log.info(`Comparing ${base} -> ${head}`);
  const changedFiles = getChangedFiles(base, head);
  log.info(`${changedFiles.length} file(s) changed.`);

  const sharedAffectsAll = String(process.env.SHARED_AFFECTS_ALL ?? "true").toLowerCase() !== "false";
  const sharedChanged = changedFiles.some((f) => f.startsWith("shared/"));
  const configChanged = changedFiles.some((f) => f === "config/sites.json");

  let changed;
  if ((sharedChanged && sharedAffectsAll) || configChanged) {
    const reason = configChanged ? "config/sites.json changed" : "shared/ changed";
    log.info(`${reason} -> rebuilding ALL sites.`);
    changed = sites.map((s) => s.name);
  } else {
    changed = sites
      .filter((s) => {
        const prefix = s.sourceDir.replace(/\/+$/, "") + "/";
        return changedFiles.some((f) => f.startsWith(prefix));
      })
      .map((s) => s.name);
  }

  const result = [...new Set(changed)];
  log.info(`Changed sites: ${result.length ? result.join(", ") : "(none)"}`);

  const outFile = path.resolve(REPO_ROOT, args.output || "changed-sites.json");
  fs.writeFileSync(outFile, JSON.stringify(result));
  log.info(`Wrote ${outFile}`);

  // Expose to Azure DevOps as an output variable (isOutput=true).
  console.log(`##vso[task.setvariable variable=changedSites;isOutput=true]${JSON.stringify(result)}`);

  // Also print raw JSON on the last line for easy capture.
  console.log(JSON.stringify(result));
  return result;
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
