import {
  assertThrows,
  assertEquals,
} from "https://deno.land/std/testing/asserts.ts";
import { getResolvedCommitType } from "../mod.ts";

Deno.test("getResolvedCommitType - throws if shortcut is unrecognised", () => {
  assertThrows(() => getResolvedCommitType("x", {}));
});

Deno.test("getResolvedCommitType - resolves matching shortcut", () => {
  assertEquals(getResolvedCommitType("F", { F: "feat" }), "feat");
});

Deno.test("getResolvedCommitType - resolves non-shorcut input", () => {
  assertEquals(getResolvedCommitType("feature", {}), "feature");
});
