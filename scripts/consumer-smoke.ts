import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

interface RunResult {
  stdout: string;
  stderr: string;
}

interface PackageManifest {
  name?: string;
}

interface NpmPackEntry {
  filename?: string;
}

const repoRoot = resolve(import.meta.dir, "..");

const readOutput = async (
  stream: ReadableStream<Uint8Array> | number | undefined | null
): Promise<string> => {
  if (typeof stream === "number" || stream === null || stream === undefined) {
    return "";
  }

  return new Response(stream).text();
};

const run = async (
  cmd: string,
  args: string[],
  cwd: string
): Promise<RunResult> => {
  const proc = Bun.spawn([cmd, ...args], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    readOutput(proc.stdout),
    readOutput(proc.stderr),
    proc.exited,
  ]);

  if (exitCode !== 0) {
    throw new Error(
      `Command failed (${cmd} ${args.join(" ")}): ${stderr || stdout || `exit code ${exitCode}`}`
    );
  }

  return { stdout, stderr };
};

const commandExists = (command: string): boolean => Bun.which(command) !== null;

type NpmCommand = [string, ...string[]];

const getNpmCommand = async (): Promise<NpmCommand> => {
  if (commandExists("npm")) {
    return ["npm"];
  }

  if (commandExists("bunx")) {
    return ["bunx", "--bun", "npm"];
  }

  throw new Error(
    "Unable to find npm. Install Node.js/npm, or install Bun so `bunx --bun npm` is available."
  );
};

const runNpm = async (
  npmCommand: NpmCommand,
  args: string[],
  cwd: string
): Promise<RunResult> => {
  const [command, ...prefixArgs] = npmCommand;
  return run(command, [...prefixArgs, ...args], cwd);
};

const supportedNodeMajors = [20, 22, 24];

const runWithNodeMajor = (
  npmCommand: NpmCommand,
  nodeMajor: number,
  nodeArgs: string[],
  cwd: string
) =>
  runNpm(
    npmCommand,
    ["exec", "--yes", `--package=node@${nodeMajor}`, "--", "node", ...nodeArgs],
    cwd
  );

const main = async (): Promise<void> => {
  const packageJsonPath = join(repoRoot, "package.json");
  const packageJson = (await Bun.file(
    packageJsonPath
  ).json()) as PackageManifest;
  const packageName = packageJson.name;

  if (!packageName) {
    throw new Error("package.json is missing a package name.");
  }

  const npmCommand = await getNpmCommand();
  const packResult = await runNpm(npmCommand, ["pack", "--json"], repoRoot);
  const packOutput = JSON.parse(packResult.stdout) as NpmPackEntry[];
  const tarballName = packOutput?.[0]?.filename;

  if (!tarballName) {
    throw new Error(
      "Could not determine tarball filename from `npm pack --json` output."
    );
  }

  const tarballPath = join(repoRoot, tarballName);
  const tempDir = await mkdtemp(join(tmpdir(), "trendsearch-consumer-"));

  try {
    await Bun.write(
      join(tempDir, "package.json"),
      JSON.stringify(
        {
          name: "consumer-smoke",
          private: true,
          type: "commonjs",
        },
        null,
        2
      )
    );

    await runNpm(
      npmCommand,
      ["install", "--no-audit", "--no-fund", tarballPath],
      tempDir
    );

    const cliInputPath = join(tempDir, "cli-input.json");
    await Bun.write(
      cliInputPath,
      `${JSON.stringify({ keyword: "typescript" }, null, 2)}\n`
    );

    for (const nodeMajor of supportedNodeMajors) {
      await runWithNodeMajor(
        npmCommand,
        nodeMajor,
        [
          "--input-type=module",
          "-e",
          `const mod = await import(${JSON.stringify(packageName)}); const required = ["createClient","autocomplete","explore","interestOverTime","interestByRegion","relatedQueries","relatedTopics","dailyTrends","realTimeTrends","trendingNow","trendingArticles","experimental","schemas","EndpointUnavailableError"]; for (const key of required) { if (!(key in mod)) throw new Error("Missing export: " + key); } if (typeof mod.createClient !== "function") throw new Error("Expected 'createClient' export to be a function.");`,
        ],
        tempDir
      );

      await runWithNodeMajor(
        npmCommand,
        nodeMajor,
        [
          "-e",
          `try { require(${JSON.stringify(packageName)}); throw new Error("Expected require() to fail for ESM-only package."); } catch (error) { const allowed = new Set(["ERR_REQUIRE_ESM", "ERR_PACKAGE_PATH_NOT_EXPORTED"]); if (!allowed.has(error?.code)) throw error; }`,
        ],
        tempDir
      );

      await runWithNodeMajor(
        npmCommand,
        nodeMajor,
        [
          "--input-type=module",
          "-e",
          `import { createRequire } from "node:module"; import { join, dirname } from "node:path"; import { spawnSync } from "node:child_process"; const require = createRequire(import.meta.url); const pkgPath = require.resolve(${JSON.stringify(`${packageName}/package.json`)}); const pkg = require(pkgPath); const binRel = typeof pkg.bin === "string" ? pkg.bin : pkg.bin?.trendsearch; if (!binRel) throw new Error("Missing trendsearch bin entry."); const binPath = join(dirname(pkgPath), binRel); const help = spawnSync(process.execPath, [binPath, "--help"], { encoding: "utf8" }); if (help.status !== 0) throw new Error("trendsearch --help failed: " + (help.stderr || help.stdout)); if (!help.stdout.includes("Usage")) throw new Error("Expected usage output from trendsearch --help.");`,
        ],
        tempDir
      );

      await runWithNodeMajor(
        npmCommand,
        nodeMajor,
        [
          "--input-type=module",
          "-e",
          `import { createRequire } from "node:module"; import { join, dirname } from "node:path"; import { spawnSync } from "node:child_process"; const require = createRequire(import.meta.url); const pkgPath = require.resolve(${JSON.stringify(`${packageName}/package.json`)}); const pkg = require(pkgPath); const binRel = typeof pkg.bin === "string" ? pkg.bin : pkg.bin?.trendsearch; if (!binRel) throw new Error("Missing trendsearch bin entry."); const binPath = join(dirname(pkgPath), binRel); const result = spawnSync(process.execPath, [binPath, "autocomplete", "--input", ${JSON.stringify(cliInputPath)}, "--output", "json", "--no-spinner", "--base-url", "http://127.0.0.1:1", "--timeout-ms", "5", "--max-retries", "0"], { encoding: "utf8" }); if (result.status === 0) throw new Error("Expected transport failure for local mock endpoint."); const payload = JSON.parse(result.stdout || "{}"); if (payload.ok !== false) throw new Error("Expected JSON error envelope."); if (!payload.error || typeof payload.error.code !== "string") throw new Error("Missing structured error payload.");`,
        ],
        tempDir
      );
    }

    console.log("Consumer smoke test passed.");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
    try {
      await Bun.file(tarballPath).delete();
    } catch {
      // Ignore cleanup errors for the temporary tarball.
    }
  }
};

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
