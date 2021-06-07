import { Command } from "cliffy/command/command.ts";

import { digcm } from "./mod.ts";

if (import.meta.main) {
  await new Command()
    .version("0.0.0")
    .description(
      "Interactive Git Commit\nCLI to step you through creating a formatted git commit message, using the format 'type(scope): message'\n\nCommit type shortcuts:\n(f)eat \n(F)ix \n(c)hore \n(r)efactor \n(s)tyle \n(b)uild \n(d)ocs",
    )
    .parse(Deno.args);

  // if cli is called with "help" or "version" it will end the process, so digcm() is not run
  digcm();
}
