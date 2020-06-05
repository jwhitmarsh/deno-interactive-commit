import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { applyScopeFormatter } from "../mod.ts";

Deno.test("applyScopeFormatter - 1 parent dirs", () => {
  assertEquals(
    applyScopeFormatter(
      { formattedScope: "", alreadyFormatted: false },
      "nested/path/filename.ts",
      "filename",
      { test: "filename", includeParentDirs: 1, case: "pascal" },
    ),
    { formattedScope: "PathFilename", alreadyFormatted: true },
  );
});

Deno.test("applyScopeFormatter - 2 parent dirs", () => {
  assertEquals(
    applyScopeFormatter(
      { formattedScope: "", alreadyFormatted: false },
      "nested/path/filename.ts",
      "filename",
      { test: "filename", includeParentDirs: 2, case: "pascal" },
    ),
    { formattedScope: "NestedPathFilename", alreadyFormatted: true },
  );
});

Deno.test("applyScopeFormatter - regex matches filename", () => {
  assertEquals(
    applyScopeFormatter(
      { formattedScope: "", alreadyFormatted: false },
      "nested/path/filename.ts",
      "filename",
      { test: "filename", includeParentDirs: 1, case: "pascal" },
    ),
    { formattedScope: "PathFilename", alreadyFormatted: true },
  );
});

Deno.test("applyScopeFormatter - regex matches parent dir", () => {
  assertEquals(
    applyScopeFormatter(
      { formattedScope: "", alreadyFormatted: false },
      "nested/path/filename.ts",
      "nested",
      { test: "nested", includeParentDirs: 1, case: "pascal" },
    ),
    { formattedScope: "PathFilename", alreadyFormatted: true },
  );
});
