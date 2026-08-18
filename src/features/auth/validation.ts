import { z } from "zod";

const consentCheckbox = z.literal("on", {
  errorMap: () => ({ message: "请确认必需同意项。" }),
});

export const signUpSchema = z.object({
  email: z.string().email("请输入有效邮箱地址。"),
  password: z.string().min(8, "密码至少需要 8 个字符。"),
  displayName: z.string().trim().min(1, "请输入显示名。").max(80, "显示名不能超过 80 个字符。"),
  timezone: z.string().trim().min(1).max(80),
  locale: z.string().trim().min(2).max(16).default("zh-CN"),
  adultConfirmed: consentCheckbox,
  termsConsent: consentCheckbox,
  privacyConsent: consentCheckbox,
  sensitiveDataConsent: consentCheckbox,
  marketingConsent: z.string().optional(),
});

export const signInSchema = z.object({
  email: z.string().email("请输入有效邮箱地址。"),
  password: z.string().min(1, "请输入密码。"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("请输入有效邮箱地址。"),
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(1, "请输入显示名。").max(80, "显示名不能超过 80 个字符。"),
  timezone: z.string().trim().min(1).max(80),
  locale: z.string().trim().min(2).max(16).default("zh-CN"),
  adultConfirmed: z.string().optional(),
});

export const consentSchema = z.object({
  termsConsent: z.string().optional(),
  privacyConsent: z.string().optional(),
  sensitiveDataConsent: z.string().optional(),
  marketingConsent: z.string().optional(),
});
