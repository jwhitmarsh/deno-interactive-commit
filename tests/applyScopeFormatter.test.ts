import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { applyScopeFormatter } from "../mod.ts";

Deno.test("applyScopeFormatter - 1 parent dirs", () => {
  assertEquals(
    applyScopeFormatter(
      { formattedScope: "", alreadyFormatted: false },
      "nested/path/filename.ts",
      "filename",
      { test: "filename", includeParentDirs: 1, transformCase: "pascal" },
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
      { test: "filename", includeParentDirs: 2, transformCase: "pascal" },
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
      { test: "filename", includeParentDirs: 1, transformCase: "pascal" },
    ),
    { formattedScope: "PathFilename", alreadyFormatted: true },
  );
});

Deno.test("applyScopeFormatter - regex matches parent dir", () => {
  assertEquals(
    applyScopeFormatter(
      { formattedScope: "", alreadyFormatted: false },
      "nested/path/filename.ts",
      "filename",
      { test: "nested", includeParentDirs: 1, transformCase: "pascal" },
    ),
    { formattedScope: "PathFilename", alreadyFormatted: true },
  );
});

Deno.test("applyScopeFormatter - pascal case", () => {
  assertEquals(
    applyScopeFormatter(
      { formattedScope: "", alreadyFormatted: false },
      "nested/path/filename.ts",
      "filename",
      { test: "filename", includeParentDirs: 1, transformCase: "pascal" },
    ),
    { formattedScope: "PathFilename", alreadyFormatted: true },
  );
});

Deno.test("applyScopeFormatter - snake case", () => {
  assertEquals(
    applyScopeFormatter(
      { formattedScope: "", alreadyFormatted: false },
      "nested/path/filename.ts",
      "filename",
      { test: "filename", includeParentDirs: 1, transformCase: "snake" },
    ),
    { formattedScope: "path_filename", alreadyFormatted: true },
  );
});

Deno.test("applyScopeFormatter - camel case", () => {
  assertEquals(
    applyScopeFormatter(
      { formattedScope: "", alreadyFormatted: false },
      "nested/path/filename.ts",
      "filename",
      { test: "filename", includeParentDirs: 1, transformCase: "camel" },
    ),
    { formattedScope: "pathFilename", alreadyFormatted: true },
  );
});

Deno.test("applyScopeFormatter - 2 parent dirs, snake case", () => {
  assertEquals(
    applyScopeFormatter(
      { formattedScope: "", alreadyFormatted: false },
      "nested/path/filename.ts",
      "filename",
      { test: "filename", includeParentDirs: 2, transformCase: "snake" },
    ),
    { formattedScope: "nested_path_filename", alreadyFormatted: true },
  );
});

Deno.test("applyScopeFormatter - 2 parent dirs, camel case", () => {
  assertEquals(
    applyScopeFormatter(
      { formattedScope: "", alreadyFormatted: false },
      "nested/path/filename.ts",
      "filename",
      { test: "filename", includeParentDirs: 2, transformCase: "camel" },
    ),
    { formattedScope: "nestedPathFilename", alreadyFormatted: true },
  );
});
