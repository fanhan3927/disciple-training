import { z } from "zod";
import {
  DEFAULT_INVITE_EXPIRES_HOURS,
  DEFAULT_INVITE_MAX_USES,
  MAX_INVITE_EXPIRES_DAYS,
  MAX_INVITE_MAX_USES,
  MAX_MEMBER_LIMIT,
} from "./constants";

export const groupFormSchema = z.object({
  name: z.string().trim().min(1, "请输入小组名称。").max(80, "小组名称不能超过 80 个字符。"),
  description: z.string().trim().max(500, "小组描述不能超过 500 个字符。").default(""),
  timezone: z.string().trim().min(1).max(80).default("Asia/Shanghai"),
  memberLimit: z.coerce.number().int().min(2).max(MAX_MEMBER_LIMIT).default(8),
  leaderCovenantAccepted: z.literal("on", {
    errorMap: () => ({ message: "Leader 必须确认盟约。" }),
  }),
});

export const groupSettingsSchema = z.object({
  groupId: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).default(""),
  timezone: z.string().trim().min(1).max(80).default("Asia/Shanghai"),
  memberLimit: z.coerce.number().int().min(2).max(MAX_MEMBER_LIMIT),
});

export const invitationFormSchema = z.object({
  groupId: z.string().uuid(),
  expiresHours: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_INVITE_EXPIRES_DAYS * 24)
    .default(DEFAULT_INVITE_EXPIRES_HOURS),
  maxUses: z.coerce.number().int().min(1).max(MAX_INVITE_MAX_USES).default(DEFAULT_INVITE_MAX_USES),
  roleToGrant: z.enum(["member", "observer"]).default("member"),
});

export const groupIdSchema = z.object({
  groupId: z.string().uuid(),
});

export const removeMemberSchema = z.object({
  groupId: z.string().uuid(),
  userId: z.string().uuid(),
});

export const tokenSchema = z.string().trim().min(24).max(256);
