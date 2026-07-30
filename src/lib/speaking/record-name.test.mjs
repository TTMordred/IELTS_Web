import assert from "node:assert/strict";
import test from "node:test";

test("normalizes optional record names and builds fallback labels", async () => {
  const helpers = await import("./record-name.ts").catch(() => null);
  assert.ok(helpers, "record-name helpers must exist");

  assert.equal(helpers.parseSpeakingRecordName("  Weekend practice  "), "Weekend practice");
  assert.equal(helpers.parseSpeakingRecordName("   "), null);
  assert.throws(() => helpers.parseSpeakingRecordName("x".repeat(121)), /120 characters/);
  assert.equal(helpers.speakingRecordLabel("My mock", "mock_test", "2026-07-30"), "My mock");
  assert.equal(helpers.speakingRecordLabel(null, "mock_test", "2026-07-30"), "Mock Test · 2026-07-30");
});
