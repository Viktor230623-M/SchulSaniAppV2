const path = require("path");
const fs = require("fs");

const root = __dirname;

// Parse .env into an object for use in pm2 env blocks
function loadEnv(file) {
  try {
    return Object.fromEntries(
      fs
        .readFileSync(file, "utf8")
        .split("\n")
        .filter((l) => l && !l.startsWith("#") && l.includes("="))
        .map((l) => {
          const idx = l.indexOf("=");
          return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
        })
    );
  } catch {
    return {};
  }
}

const env = loadEnv(path.join(root, ".env"));

module.exports = {
  apps: [
    {
      name: "api",
      script: path.join(root, "apps/api/dist/index.mjs"),
      interpreter: "node",
      interpreter_args: "--enable-source-maps",
      cwd: path.join(root, "apps/api"),
      env,
      watch: false,
      log_date_format: "HH:mm:ss",
    },
    {
      name: "mobile",
      script: path.join(
        root,
        "apps/mobile/node_modules/@expo/cli/build/bin/cli"
      ),
      args: "start",
      interpreter: "node",
      cwd: path.join(root, "apps/mobile"),
      env,
      watch: false,
      log_date_format: "HH:mm:ss",
    },
  ],
};
