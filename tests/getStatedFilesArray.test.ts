import {
  assertThrows,
  assertEquals,
} from "https://deno.land/std/testing/asserts.ts";
import { getStagedFilesArray } from "../mod.ts";

Deno.test("getStagedFilesArray - throws if diffOutput is empty", () => {
  const emptyArray = new Uint8Array();
  assertThrows(
    () => getStagedFilesArray(emptyArray),
  );
});

Deno.test("getStagedFilesArray - returns a string array", () => {
  const diffOutput = new TextEncoder().encode(
    "file1.txt\nfile2.txt\nfile3.txt",
  );

  assertEquals(
    getStagedFilesArray(diffOutput),
    ["file1", "file2", "file3", "Custom"],
  );
});
