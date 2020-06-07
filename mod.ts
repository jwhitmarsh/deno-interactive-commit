#!/usr/bin/env deno --allow-run --allow-read --unstable

import { Input, Select } from "https://deno.land/x/cliffy/prompt.ts";
import {
  basename,
  extname,
  sep,
  dirname,
} from "https://deno.land/std/path/mod.ts";
import { Config } from "https://raw.githubusercontent.com/eankeen/config/master/mod.ts";
import {
  pascalCase,
  camelCase,
  snakeCase,
} from "https://deno.land/x/case/mod.ts";

const { exit, run, cwd } = Deno;

interface DgcmConfig {
  scopeFormatters?: DgcmScopeFormatter[];
  shortcuts?: Record<string, string>;
}

interface DgcmScopeFormatter {
  test: string;
  includeParentDirs: number;
  transformCase: "camel" | "pascal" | "snake";
}

interface ScopeFormatResult {
  formattedScope: string;
  alreadyFormatted: boolean;
}

export async function digcm() {
  try {
    const config = await loadConfig();
    const diffOutput = await getDiffOuput();
    const stagedFilesArray = getStagedFilesArray(diffOutput, config);
    const commitType = await getCommitType(config?.shortcuts);
    const scope = await getScope(stagedFilesArray);
    const message = await Input.prompt(`Message:`);

    const finalCommitMessage = `${commitType}${scope}: ${message}`;

    await run({
      cmd: ["git", "commit", "-m", finalCommitMessage],
    }).status();
  } catch (error) {
    console.error(error.message);
    exit(1);
  }
}

async function loadConfig(): Promise<DgcmConfig | undefined> {
  const config = await Config.load({
    file: "digcm",
    searchDir: cwd(),
  });

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
    throw Error(`Error fetching staged files list:\n${errorString}`);
  }

  return p.output();
}

function getStagedFilesArray(diffOutput: Uint8Array, config?: DgcmConfig) {
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
    throw Error("No files have been staged");
  }

  stagedFilesArray.push("Custom");

  return stagedFilesArray;
}

async function getCommitType(customShortcuts?: Record<string, string>) {
  const commitTypeDict: Record<string, string> = {
    F: "feat",
    f: "fix",
    c: "chore",
    r: "refactor",
    s: "style",
    b: "build",
    d: "docs",
    t: "tests",
  };

  if (customShortcuts) {
    Object.assign(commitTypeDict, customShortcuts);
  }

  let commitType: string = await Input.prompt(
    `Commit type:`,
  );

  if (commitType.length === 1) {
    const resolvedCommitType = commitTypeDict[commitType];
    if (!resolvedCommitType) {
      throw Error(`Unrecognised shortcut "${commitType}"`);
    }

    commitType = resolvedCommitType;
  }

  return commitType;
}

async function getScope(stagedFilesArray: string[]) {
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

export function applyScopeFormatter(
  scope: ScopeFormatResult,
  filePath: string,
  filename: string,
  { test, includeParentDirs, transformCase }: DgcmScopeFormatter,
): ScopeFormatResult {
  const regex = new RegExp(test);

  if (!regex.test(filePath)) {
    return {
      formattedScope: filename,
      alreadyFormatted: scope.alreadyFormatted,
    };
  }

  if (scope.alreadyFormatted) {
    throw Error(
      `Mutliple scopeFormatters apply to filename which is not currently supported. Filepath: ${filePath}`,
    );
  }

  const pathParts = dirname(filePath).split(sep);
  if (includeParentDirs > pathParts.length) {
    throw Error(
      `config.includeParentDirs "${includeParentDirs}" is greater than the directory depth. Filepath: ${filePath}`,
    );
  }

  const requiredPathParts = pathParts.slice(
    pathParts.length - includeParentDirs,
  );
  // join with underscore so we can apply case formatter later
  const requiredPathPartsString = requiredPathParts.join("_");

  let caseFormatter;
  switch (transformCase) {
    case "pascal":
      caseFormatter = pascalCase;
      break;
    case "snake":
      caseFormatter = snakeCase;
      break;
    case "camel":
      caseFormatter = camelCase;
      break;
    default:
      throw Error(
        `unrecognised config.transformCase "${transformCase}"`,
      );
  }

  return {
    formattedScope: caseFormatter(`${requiredPathPartsString}_${filename}`),
    alreadyFormatted: true,
  };
}
