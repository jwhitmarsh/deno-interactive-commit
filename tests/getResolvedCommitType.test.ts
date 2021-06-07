import { assertEquals, assertThrows } from "std/testing/asserts.ts";
import { getResolvedCommitType } from "../mod.ts";

Deno.test("getResolvedCommitType - throws if shortcut is unrecognized", () => {
  assertThrows(() => getResolvedCommitType("x", {}));
});

Deno.test("getResolvedCommitType - resolves matching shortcut", () => {
  assertEquals(getResolvedCommitType("F", { F: "feat" }), "feat");
});

Deno.test("getResolvedCommitType - resolves non-shortcut input", () => {
  assertEquals(getResolvedCommitType("feature", {}), "feature");
});
