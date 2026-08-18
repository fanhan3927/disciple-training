import { z } from "zod";

const uuid = z.string().uuid();
const safeText = (max: number) => z.string().trim().min(1).max(max);

export const postFormSchema = z.object({
  groupId: uuid,
  weekNumber: z.coerce.number().int().min(1).max(4).nullable().optional(),
  title: safeText(160),
  body: safeText(4000),
});

export const commentFormSchema = z.object({
  groupId: uuid,
  postId: uuid,
  body: safeText(2000),
});

export const reactionFormSchema = z.object({
  groupId: uuid,
  targetId: uuid,
  targetType: z.enum(["post", "comment"]),
  reactionType: z.enum(["encouragement", "prayer"]),
});

export const moderatePostSchema = z.object({
  groupId: uuid,
  postId: uuid,
  status: z.enum(["active", "hidden", "deleted"]),
});

export const prayerFormSchema = z.object({
  groupId: uuid,
  title: safeText(160),
  body: safeText(4000),
  visibility: z.enum(["private", "leader_only", "group"]).default("private"),
  expiresAt: z.string().trim().optional(),
});

export const prayerStatusSchema = z.object({
  groupId: uuid,
  requestId: uuid,
  status: z.enum(["open", "continued", "ended", "responded"]),
});

export const prayerResponseSchema = z.object({
  groupId: uuid,
  requestId: uuid,
  responseType: z.enum(["prayed", "encouragement"]),
  body: z.string().trim().max(1000).optional(),
});

export const notificationSchema = z.object({
  notificationId: uuid,
});
