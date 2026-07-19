import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Địa Chứng strategic market dashboard", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Địa Chứng — Giám sát nội dung mạng xã hội<\/title>/i);
  assert.match(html, /Toàn cảnh thảo luận thị trường/);
  assert.match(html, /Xu hướng thảo luận theo thời gian/);
  assert.match(html, /Top chủ đề được bàn luận nhiều nhất/);
  assert.match(html, /Heatmap điểm nóng/);
  assert.match(html, /Hàng đợi giám sát/);
  assert.match(html, /Tầng kiểm chứng/);
  assert.match(html, /Dữ liệu mẫu dự phòng/);
});

test("production UI no longer contains starter preview artifacts", async () => {
  const [htmlResponse, page, layout, packageJson] = await Promise.all([
    render(),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  const html = await htmlResponse.text();

  assert.match(page, /<MarketOverview/);
  assert.match(layout, /Địa Chứng/);
  assert.doesNotMatch(html, /Your site is taking shape|Codex is working|codex-preview/i);
  assert.doesNotMatch(page, /_sites-preview|SkeletonPreview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});

test("catch-all routes render the same dashboard shell", async () => {
  const response = await render("/verify");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Địa Chứng/);
  assert.match(html, /src="\/dia-chung-logo\.png"/);
  assert.doesNotMatch(html, /_vinext\/image\?url=%2Fdia-chung-logo\.png/);
  assert.match(html, /Hàng đợi giám sát/);
});
