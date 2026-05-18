const { spawn } = require("node:child_process");
const { existsSync, readFileSync } = require("node:fs");
const { join } = require("node:path");

const [, , scriptName, ...flags] = process.argv;
const parallel = flags.includes("--parallel");
const root = process.cwd();

if (!scriptName) {
  console.error("Usage: node ./scripts/run-workspaces.js <script> [--parallel]");
  process.exit(1);
}

const rootPackage = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const workspacePaths = rootPackage.workspaces || [];
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const useShell = process.platform === "win32";

const workspaces = workspacePaths
  .map((workspacePath) => {
    const packagePath = join(root, workspacePath, "package.json");

    if (!existsSync(packagePath)) {
      return null;
    }

    const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

    if (!packageJson.scripts || !packageJson.scripts[scriptName]) {
      return null;
    }

    return {
      name: packageJson.name || workspacePath,
      path: workspacePath,
    };
  })
  .filter(Boolean);

if (workspaces.length === 0) {
  console.error(`No workspaces define an npm script named "${scriptName}".`);
  process.exit(1);
}

function runWorkspace(workspace) {
  return new Promise((resolve) => {
    const child = spawn(
      npmCommand,
      ["run", scriptName],
      {
        cwd: join(root, workspace.path),
        stdio: "inherit",
        shell: useShell,
      }
    );

    child.on("error", (error) => {
      console.error(`Failed to run "${scriptName}" in ${workspace.name}:`);
      console.error(error);
      resolve({
        workspace,
        code: 1,
      });
    });

    child.on("close", (code, signal) => {
      resolve({
        workspace,
        code: code ?? 1,
        signal,
      });
    });
  });
}

async function runSequentially() {
  for (const workspace of workspaces) {
    const result = await runWorkspace(workspace);

    if (result.code !== 0) {
      process.exit(result.code);
    }
  }
}

function runInParallel() {
  const children = workspaces.map((workspace) => {
    const child = spawn(
      npmCommand,
      ["run", scriptName],
      {
        cwd: join(root, workspace.path),
        stdio: "inherit",
        shell: useShell,
      }
    );

    child.on("error", (error) => {
      console.error(`Failed to run "${scriptName}" in ${workspace.name}:`);
      console.error(error);
      if (!shuttingDown) {
        shutdown(1);
      }
    });

    child.on("close", (code) => {
      if (code && !shuttingDown) {
        shutdown(code);
      }
    });

    return child;
  });

  let shuttingDown = false;

  function shutdown(code = 0) {
    shuttingDown = true;

    for (const child of children) {
      if (!child.killed) {
        child.kill();
      }
    }

    process.exit(code);
  }

  process.on("SIGINT", () => shutdown(0));
  process.on("SIGTERM", () => shutdown(0));
}

if (parallel) {
  runInParallel();
} else {
  runSequentially().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
