import { Input, Select } from "https://deno.land/x/cliffy/prompt.ts";
import {
  basename,
  extname,
  sep,
  dirname,
} from "https://deno.land/std/path/mod.ts";
import { Config } from "https://raw.githubusercontent.com/eankeen/config/master/mod.ts";
import { pascalCase } from "https://deno.land/x/case/mod.ts";

const { exit, run, cwd } = Deno;

interface DgcmConfig {
  scopeFormatters?: DgcmScopeFormatter[];
}

interface DgcmScopeFormatter {
  test: string;
  includeParentDirs: number;
  case: "camel" | "pascal";
}

interface ScopeFormatResult {
  formattedScope: string;
  alreadyFormatted: boolean;
}

const config = await loadConfig();
const diffOutput = await getDiffOuput();
const stagedFilesArray = getStagedFilesArray(diffOutput);
const commitType = await getCommitType();
const scope = await getScope();
const message = await Input.prompt(`Message:`);

const finalCommitMessage = `${commitType}${scope}: ${message}`;

await run({
  cmd: ["git", "commit", "-m", finalCommitMessage],
}).status();

async function loadConfig(): Promise<DgcmConfig> {
  const config = await Config.load({
    file: "dgcm",
    searchDir: cwd(),
  });
  if (!config) {
    console.log("config is 'undefined' when no config files were found");
    return exit(1);
  }

  return config;
}

async function getDiffOuput() {
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

  return p.output();
}

function getStagedFilesArray(diffOutput: Uint8Array) {
  const stagedFilesStr = new TextDecoder().decode(diffOutput);

  const stagedFilesArray = stagedFilesStr
    .split("\n")
    .filter((filePath) => filePath.length)
    .map((filePath) => {
      const fileName = basename(filePath, extname(filePath));
      let fileNameForList = fileName;

      if (config?.scopeFormatters?.length) {
        const scopeFormatResult = config?.scopeFormatters?.reduce(
          (scope, ScopeFormatter) => {
            scope = applyScopeFormatter(
              scope,
              filePath,
              fileName,
              ScopeFormatter,
            );
            return scope;
          },
          { formattedScope: "", alreadyFormatted: false },
        );
        fileNameForList = scopeFormatResult.formattedScope;
      }

      return fileNameForList;
    });

  if (!stagedFilesArray.length) {
    console.error("No files have been staged");
    exit(1);
  }

  stagedFilesArray.push("Custom");

  return stagedFilesArray;
}

async function getCommitType() {
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
    `Type: (f)eat (F)ix (c)hore (r)efactor (s)tyle (b)uild (d)ocs`,
  );

  if (commitType.length === 1) {
    const resolvedCommitType = commitTypeDict[commitType];
    if (!resolvedCommitType) {
      console.error(`Unrecognised shortcut "${commitType}"`);
      exit(1);
    }

    commitType = resolvedCommitType;
  }

  return commitType;
}

async function getScope() {
  let scope: string = await Select.prompt({
    message: "Scope:",
    options: stagedFilesArray,
  });

  if (scope === "Custom") {
    scope = await Input.prompt(`Custom scope:`);
  }

  if (scope.length) {
    scope = `(${scope})`;
  }

  return scope;
}

function applyScopeFormatter(
  scope: ScopeFormatResult,
  filePath: string,
  fileName: string,
  { test, includeParentDirs }: DgcmScopeFormatter,
): ScopeFormatResult {
  const regex = new RegExp(test);
  if (!regex.test(fileName)) {
    return {
      formattedScope: fileName,
      alreadyFormatted: scope.alreadyFormatted,
    };
  }

  if (scope.alreadyFormatted) {
    console.error(
      "mutliple scopeFormatters apply to filename which is not currently supported",
    );
    console.error(filePath);
    exit(1);
  }

  const pathParts = dirname(filePath).split(sep);
  if (includeParentDirs > pathParts.length) {
    console.error(
      `config.includeParentDirs "${includeParentDirs}" is greater than the directory depth`,
    );
    console.error(filePath);
    exit(1);
  }

  const requiredPathParts = pathParts.slice(
    pathParts.length - includeParentDirs,
  );
  // join with underscore so we can apply case formatter later
  const requiredPathPartsString = requiredPathParts.join("_");

  return {
    formattedScope: pascalCase(`${requiredPathPartsString}_${fileName}`),
    alreadyFormatted: true,
  };
}
