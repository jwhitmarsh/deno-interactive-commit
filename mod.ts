#!/usr/bin/env deno --allow-run --allow-read --unstable

import { Checkbox, Input, prompt, Select } from "cliffy/prompt/mod.ts";
import { basename, dirname, extname, sep } from "std/path/mod.ts";
import {
  camelCase,
  paramCase,
  pascalCase,
  pathCase,
  snakeCase,
} from "case/mod.ts";
import { Config } from "https://raw.githubusercontent.com/eankeen/config/v1.1/mod.ts";

const { exit, run, cwd } = Deno;

const CUSTOM = "Custom";

interface DgcmConfig {
  scopeFormatters?: DgcmScopeFormatter[];
  shortcuts?: Record<string, string>;
}

interface DgcmScopeFormatter {
  test: string;
  includeParentDirs: number;
  prefix?: string;
  transformCase: "camel" | "pascal" | "snake" | "kebab" | "param" | "path";
}

interface ScopeFormatResult {
  formattedScope: string;
  alreadyFormatted: boolean;
}

export async function digcm() {
  try {
    const config = await loadConfig();
    const diffOutput = await getDiffOutput();
    const stagedFilesArray = getStagedFilesArray(diffOutput, config);
    const commitType = await getCommitType(config?.shortcuts);
    const scope = await getScope(stagedFilesArray);
    const message = await Input.prompt(`Message:`);
    const body = await Input.prompt(`Body:`);

    const finalCommitMessage = `${commitType}${scope}: ${message}`;

    const cmd = ["git", "commit", "-m", finalCommitMessage];

    if (body.length) {
      cmd.push("-m", body);
    }

    await run({
      cmd,
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

async function getDiffOutput() {
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

export function getStagedFilesArray(
  diffOutput: Uint8Array,
  config?: DgcmConfig,
) {
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

  stagedFilesArray.push(CUSTOM);

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

  const commitType: string = await Input.prompt(
    `Commit type:`,
  );

  return getResolvedCommitType(commitType, commitTypeDict);
}

export function getResolvedCommitType(
  commitType: string,
  commitTypeDict: Record<string, string>,
) {
  if (commitType.length > 1) {
    return commitType;
  }

  const resolvedCommitType = commitTypeDict[commitType];
  if (!resolvedCommitType) {
    throw Error(`Unrecognized shortcut "${commitType}"`);
  }

  return resolvedCommitType;
}

async function getScope(stagedFilesArray: string[]) {
  let scope: string;
  const selectedScope = await prompt([{
    type: stagedFilesArray.filter((f) => f !== CUSTOM).length === 1
      ? Select
      : Checkbox,
    message: "Scope:",
    options: stagedFilesArray,
    name: "scope",
  }]);

  scope = Array.isArray(selectedScope.scope)
    ? selectedScope.scope.join(",")
    : selectedScope.scope ?? "";

  if (scope === CUSTOM) {
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
  { test, includeParentDirs, prefix, transformCase }: DgcmScopeFormatter,
): ScopeFormatResult {
  const regex = new RegExp(test);

  if (!regex.test(filePath)) {
    return {
      formattedScope: scope.formattedScope?.length
        ? scope.formattedScope
        : filename,
      alreadyFormatted: scope.alreadyFormatted,
    };
  }

  if (scope.alreadyFormatted) {
    throw Error(
      `Multiple scopeFormatters apply to filename which is not currently supported. Filepath: ${filePath}`,
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

  const fullPath = [...requiredPathParts];
  if (prefix) {
    fullPath.unshift(prefix);
  }

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
    case "kebab":
      caseFormatter = paramCase;
      break;
    case "param":
      caseFormatter = paramCase;
      break;
    case "path":
      caseFormatter = pathCase;
      break;
    case undefined:
      caseFormatter = (str: string) => str;
      break;
    default:
      throw Error(
        `Unrecognized config.transformCase "${transformCase}"`,
      );
  }

  return {
    formattedScope: caseFormatter([...fullPath, filename].join(
      transformCase ? "_" : "/",
    )),
    alreadyFormatted: true,
  };
}
