import { z } from "zod";

export const reportSchema = z.object({
  groupId: z.string().uuid(),
  targetType: z.enum(["post", "comment", "prayer", "member", "group"]),
  targetId: z.string().uuid(),
  category: z.string().trim().min(1).max(80),
  details: z.string().trim().max(4000).optional(),
});

export const rightsRequestSchema = z.object({ confirmation: z.literal("confirm") });
