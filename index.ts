import { Input, Select } from "https://deno.land/x/cliffy/prompt.ts";
const { exit, run } = Deno;

const p = run({
  cmd: ["git", "diff", "--name-only", "--cached"],
  stdout: "piped",
  stderr: "piped",
});

// await its completion
const { code } = await p.status();
if (code !== 0) {
  const rawError = await p.stderrOutput();
  const errorString = new TextDecoder().decode(rawError);
  console.error(`Error fetching staged files list:`);
  console.error(errorString);
  exit(code);
}

const diffOutput = await p.output();
const stagedFilesStr = new TextDecoder().decode(diffOutput);
const stagedFilesArray = stagedFilesStr
  .split("\n")
  .filter((fileName) => fileName.length);

if (!stagedFilesArray.length) {
  console.error("No files have been staged");
  exit(1);
}

stagedFilesArray.push("Custom");

const commitTypeDict: Record<string, string> = {
  f: "feat",
  F: "fix",
  c: "chore",
  r: "refactor",
  s: "style",
  b: "build",
  d: "docs",
};

let commitType: string = await Input.prompt(
  `Type: (f)eat (F)ix (c)hore (r)efactor (s)tyle (b)uild (d)ocs`
);

if (commitType.length === 1) {
  const resolvedCommitType = commitTypeDict[commitType];
  if (!resolvedCommitType) {
    console.error(`Unrecognised shortcut "${commitType}"`);
    exit(1);
  }

  commitType = resolvedCommitType;
}

let scope: string = await Select.prompt({
  message: "Scope:",
  options: stagedFilesArray,
});

if (scope === "Custom") {
  scope = await Input.prompt(`Custom scope:`);
}

const message: string = await Input.prompt(`Message:`);

console.log({ commitType, scope, message });
