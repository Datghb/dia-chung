import { expect, test } from "@playwright/test";

const queueItem = {
  id: "case-review",
  text: "Nội dung cần chuyên viên xem xét",
  claim: "Cá nhân chia sẻ thông tin chưa được kiểm chứng",
  label: "can_kiem_chung",
  keywords: ["chia sẻ", "thông tin"],
  citations: [],
  source_label: "chua_tim_thay_nguon",
  reason: "Chưa có nguồn trực tiếp hỗ trợ kết luận",
  priority: 1,
  platform: "Facebook",
  account: "Tài khoản thử nghiệm",
  published_at: "19/07/2026",
  created_at: "19/07/2026",
  reach: 120,
  status: "new",
  document: "Nghị định 174/2026/NĐ-CP",
  provision: "Cần đối chiếu",
  penalty: "Chưa đủ căn cứ",
  subject: "Cá nhân",
  source_title: "Chưa tìm thấy nguồn phù hợp",
  source_url: "",
  source_agency: "",
  score: 50,
  confidence: 50,
  spread_risk: 45,
  ai_accuracy: 30,
  source_reliability: 0,
  comments: [],
};

test("reviewer rejects an AI result and creates an audited decision", async ({ page }) => {
  await page.route("**/api/queue?*", async (route) => {
    await route.fulfill({ json: [queueItem] });
  });
  await page.route("**/api/auth/session", async (route) => {
    const request = route.request();
    expect(request.headers()["x-admin-key"]).toBe("operator-test-key");
    await route.fulfill({
      json: {
        subject: "web-reviewer",
        role: "reviewer",
        csrf_token: "csrf-e2e",
        expires_at: 9999999999,
      },
      headers: {
        "set-cookie": "legal_radar_session=signed; Path=/api; HttpOnly; SameSite=Strict",
      },
    });
  });
  await page.route("**/api/cases/case-review/review", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("POST");
    expect(request.headers()["x-csrf-token"]).toBe("csrf-e2e");
    expect(request.postDataJSON()).toEqual({
      decision: "rejected",
      note: "Citation chưa hỗ trợ trực tiếp cho claim",
      expected_version: 1,
    });
    await route.fulfill({ json: { ...queueItem, status: "resolved" } });
  });

  await page.goto("/queue");
  await page.getByRole("table").getByText(queueItem.claim).click();
  await expect(page.getByRole("heading", { name: "Quyết định của chuyên viên" })).toBeVisible();

  await page.getByRole("button", { name: "Bác bỏ kết quả" }).click();
  await page.getByPlaceholder("Nêu căn cứ chấp nhận, hiệu chỉnh hoặc bác bỏ…").fill(
    "Citation chưa hỗ trợ trực tiếp cho claim",
  );
  await page.getByPlaceholder("Không lưu trong trình duyệt").fill("operator-test-key");
  await page.getByRole("button", { name: "Ký và hoàn tất thẩm định" }).click();

  await expect(page.getByRole("status")).toContainText("Đã lưu quyết định");
  await expect(page.getByLabel("Trạng thái xử lý")).toHaveValue("Đã xử lý");
});
