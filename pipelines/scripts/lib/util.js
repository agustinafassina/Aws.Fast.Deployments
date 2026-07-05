"use strict";

function parseArgs(argv = process.argv.slice(2)) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith("--")) {
      const eq = token.indexOf("=");
      if (eq !== -1) {
        args[token.slice(2, eq)] = token.slice(eq + 1);
      } else {
        const next = argv[i + 1];
        if (next && !next.startsWith("--")) {
          args[token.slice(2)] = next;
          i++;
        } else {
          args[token.slice(2)] = true;
        }
      }
    } else {
      args._.push(token);
    }
  }
  return args;
}

const log = {
  info: (...a) => console.log("[info]", ...a),
  warn: (...a) => console.warn("[warn]", ...a),
  error: (...a) => console.error("[error]", ...a),
  step: (...a) => console.log("\n=>", ...a),
};

function isDryRun(args = {}) {
  return args.dryRun === true || String(process.env.DRY_RUN).toLowerCase() === "true";
}

module.exports = { parseArgs, log, isDryRun };
