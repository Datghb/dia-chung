import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("case detail exposes a real human-review workflow", async () => {
  const [detail, queries] = await Promise.all([
    readFile(new URL("../components/cases/case-detail.tsx", import.meta.url), "utf8"),
    readFile(new URL("../hooks/use-queries.ts", import.meta.url), "utf8"),
  ]);

  assert.match(detail, /Chấp nhận kết quả AI/);
  assert.match(detail, /Sửa kết luận/);
  assert.match(detail, /Bác bỏ kết quả/);
  assert.match(queries, /X-Admin-Key/);
  assert.match(queries, /X-CSRF-Token/);
  assert.match(queries, /credentials: "include"/);
  assert.match(queries, /cases\/\$\{id\}\/review/);
  assert.match(queries, /invalidateQueries\(\{ queryKey: \["queue"\] \}\)/);
});
