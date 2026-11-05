import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const FONT_EXTENSION = /\.(?:woff2?|ttf|otf|eot|ttc|otc)$/i;
const PRIVATE_OR_GENERATED_DIRECTORY =
  /(?:^|\/)(?:fonts|dist|\.vite|\.astro|\.wrangler|node_modules)\//i;

// Inspect the Git index: .gitignore does not protect already tracked or force-added files.
// A failed Git invocation must fail the check rather than silently passing.
const trackedFiles = execFileSync("git", ["ls-files", "--cached", "-z"], {
  cwd: ROOT,
  encoding: "utf8",
})
  .split("\0")
  .filter(Boolean);

const forbiddenFiles = trackedFiles.filter(
  (path) => FONT_EXTENSION.test(path) || PRIVATE_OR_GENERATED_DIRECTORY.test(path),
);

if (forbiddenFiles.length > 0) {
  process.stderr.write(
    `Refusing tracked fonts or generated output. Remove these paths from the Git index before committing:\n${forbiddenFiles.map((path) => `- ${path}`).join("\n")}\n`,
  );
  process.exitCode = 1;
}
