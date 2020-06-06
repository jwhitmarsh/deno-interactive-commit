# Deno Interactive Git Commit

A CLI to step you through creating a formatted git commit message based on the files that you have staged, using the format `type(scope): message`, e.g., `feat(UsersModel): add "lastLogin" property`.

![demo](https://github.com/jwhitmarsh/deno-interactive-commit/blob/master/demo.gif)

## Install

The `-n` value is the name of the command that will be installed as, so you can change this to an abbreviation that suits you.

`deno install --allow-read --allow-run --unstable -n digcm https://raw.githubusercontent.com/jwhitmarsh/deno-interactive-commit/master/cli.ts`

## Permissions

allow-read: to read config files

allow-run: to run git commands (status, commit)

unstable: required to run [cliffy](https://github.com/c4spar/deno-cliffy) (CLI library) and [deno stdlib](https://deno.land/manual/standard_library#troubleshooting)

## Commit type shortcuts:

(f)eat

(F)ix

(c)hore

(r)efactor

(s)tyle

(b)uild

(d)ocs

## Config

Config should be stored in a `.digcm.{json,yaml,yml,toml}` file.

### Options

#### scopeParsers

Define tranformations for the `scope` part of the message. This allows you to include parent directories and change the case.

| Prop              | Value                                       |
| ----------------- | ------------------------------------------- |
| test              | RegEx used to match files                   |
| includeParentDirs | Number of parent directory names to include |
| transformCase     | Case transformation to apply                |

##### Example

This parser would convert `/src/api/users/model.ts` to `UsersModel`

```json
{
  "scopeParsers": [
    {
      "test": "model",
      "includeParentDirs": 1,
      "transformCase": "pascal"
    }
  ]
}
```

## Roadmap

- add more tests
- add optional prompt for commit message body
- extend config to allow more `scopeParser` options
