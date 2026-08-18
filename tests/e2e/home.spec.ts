import { expect, test } from "@playwright/test";

test("home page renders the M0 baseline on mobile", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "受信任熟人小组的门徒训练空间" })).toBeVisible();
  await expect(page.getByText("业务功能尚未开启")).toBeVisible();
});

test("signup page exposes required consent checkboxes", async ({ page }) => {
  await page.goto("/signup");

  await expect(page.getByRole("heading", { name: "注册" })).toBeVisible();
  await expect(page.getByLabel("我确认自己已满 18 岁。")).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /服务条款/ })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /^我同意 隐私政策。$/ })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /敏感内容/ })).toBeVisible();
});

test("groups page does not expose a public directory without configuration", async ({ page }) => {
  await page.goto("/groups");

  await expect(page.getByText("Supabase 尚未配置")).toBeVisible();
  await expect(page.getByText("没有公开小组目录")).not.toBeVisible();
});

test("invalid invite preview does not leak members", async ({ page }) => {
  await page.goto("/invite/not-a-real-invitation-token");

  await expect(page.getByText("Supabase 尚未配置")).toBeVisible();
  await expect(page.getByText("成员列表")).not.toBeVisible();
});

test("course week route is protected by Supabase configuration", async ({ page }) => {
  await page.goto("/groups/00000000-0000-0000-0000-000000000001/week/1");

  await expect(page.getByText("Supabase 尚未配置")).toBeVisible();
});
