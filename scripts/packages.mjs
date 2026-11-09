// Fetches the package repos listed in packages.json and generates their docs with `omilaxr-mcp export-docs`.
//
//   node scripts/packages.mjs                    clone/update the repos into .packages/ (CI)
//   node scripts/packages.mjs --local ..         use the repos checked out in a workspace folder instead
//   node scripts/packages.mjs --local .. --check <package dir>
//                                                only report components of that package without a <summary>
//
// The exporter comes from OmiLAXR.MCP: --mcp <dir>, else <workspace>/OmiLAXR.MCP, else .packages/OmiLAXR.MCP
// (checked out by the deploy workflow). It needs the .NET 10 SDK.
//
// In CI mode, repos that cannot be cloned (private ones) are skipped. Without OmiLAXR.MCP no package docs are
// generated, and the site is built from the hand-written pages only.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";

const root = resolve(import.meta.dirname, "..");
const contentDir = join(root, "src", "content", "docs");
const manifestFile = join(root, "src", "generated", "packages.json");
const config = JSON.parse(readFileSync(join(root, "packages.json"), "utf8"));

const { values: args } = parseArgs({
  options: {
    local: { type: "string" },
    mcp: { type: "string" },
    check: { type: "string" },
  },
});

const run = (cmd, cmdArgs, options = {}) => execFileSync(cmd, cmdArgs, { stdio: "inherit", ...options });
// Shows up as an annotation on the workflow run.
const warn = (message) => console.warn(process.env.GITHUB_ACTIONS ? `::warning::${message}` : `warning: ${message}`);

function fetchRepos() {
  const dir = join(root, ".packages");
  for (const { repo, ref = "main" } of config.packages) {
    const target = join(dir, repo);
    // Never ask for credentials: a private repo fails and is skipped.
    const env = { ...process.env, GIT_TERMINAL_PROMPT: "0" };
    try {
      if (existsSync(join(target, ".git"))) {
        run("git", ["-C", target, "fetch", "--quiet", "--depth", "1", "origin", ref], { env });
        run("git", ["-C", target, "checkout", "--quiet", "--force", "FETCH_HEAD"], { env });
      } else {
        run("git", ["clone", "--quiet", "--depth", "1", "--branch", ref, `https://github.com/${config.org}/${repo}.git`, target], { env });
      }
      console.log(`${repo} @ ${ref}`);
    } catch {
      warn(`Skipped ${repo}: it cannot be cloned (private or missing).`);
    }
  }
  return dir;
}

function packageName(dir) {
  const file = join(dir, "package.json");
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")).name : undefined;
}

function removeGenerated() {
  if (!existsSync(manifestFile)) return;
  // Packages removed from packages.json would otherwise stay in the content folder.
  for (const { slug } of JSON.parse(readFileSync(manifestFile, "utf8"))) rmSync(join(contentDir, slug), { recursive: true, force: true });
}

const ci = !args.local && !args.check;
const workspace = ci ? fetchRepos() : resolve(args.local ?? "..");
const mcp = [args.mcp, join(workspace, "OmiLAXR.MCP"), join(root, ".packages", "OmiLAXR.MCP")]
  .filter(Boolean)
  .map((p) => resolve(p))
  .find((p) => existsSync(join(p, "src", "OmiLAXR.MCP", "OmiLAXR.MCP.csproj")));
if (!mcp) {
  if (!ci) {
    console.error("OmiLAXR.MCP not found. Check it out next to the packages or pass --mcp <dir>.");
    process.exit(1);
  }
  warn("OmiLAXR.MCP is not available (private repo without MCP_READ_TOKEN?). The site is built without package docs.");
  removeGenerated();
  mkdirSync(dirname(manifestFile), { recursive: true });
  writeFileSync(manifestFile, "[]\n");
  process.exit(0);
}

// Only the listed repos are exported; other folders in the workspace are still scanned for base classes.
const listed = config.packages.map(({ repo }) => packageName(join(workspace, repo))).filter(Boolean);
const only = args.check ? [packageName(resolve(args.check))] : listed;
if (only.some((name) => !name)) {
  console.error(`${args.check} has no package.json.`);
  process.exit(1);
}

const outDir = args.check ? mkdtempSync(join(tmpdir(), "omilaxr-docs-check-")) : contentDir;
const manifest = args.check ? join(outDir, "packages.json") : manifestFile;

if (!args.check) removeGenerated();

run("dotnet", [
  "run", "--project", join(mcp, "src", "OmiLAXR.MCP"), "-c", "Release", "--",
  "export-docs", "--workspace", workspace, "--out", outDir, "--manifest", manifest, "--packages", only.join(","),
]);

if (args.check) {
  rmSync(outDir, { recursive: true, force: true });
} else {
  // Sidebar order follows packages.json.
  const exported = JSON.parse(readFileSync(manifestFile, "utf8"));
  exported.sort((a, b) => listed.indexOf(a.name) - listed.indexOf(b.name));
  writeFileSync(manifestFile, JSON.stringify(exported, null, 2) + "\n");
}
