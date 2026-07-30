import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("shows all three answer sheets while creating a speaking record", async () => {
  const source = await readFile(new URL("./page.tsx", import.meta.url), "utf8");

  assert.match(source, /<Part1Notebook/);
  assert.match(source, /onDraftChange=/);
  for (const part of [1, 2, 3]) {
    assert.match(source, new RegExp(`part=\\{${part}\\}`));
  }
});
