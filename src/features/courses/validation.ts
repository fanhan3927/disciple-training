import { z } from "zod";

const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(5, 7));
    const day = Number(value.slice(8, 10));
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }, "请输入有效日期。");

export const cohortFormSchema = z.object({
  groupId: z.string().uuid(),
  courseVersionId: z.string().uuid(),
  startsOn: calendarDateSchema,
  meetingUrl: z.string().url().optional().or(z.literal("")),
  meetingSchedule: z.string().trim().max(200).optional(),
});

export const taskActionSchema = z.object({
  groupId: z.string().uuid(),
  cohortId: z.string().uuid(),
  lessonId: z.string().uuid(),
  taskId: z.string().uuid(),
});

export const entryFormSchema = taskActionSchema.extend({
  body: z.string().trim().min(1, "请输入记录内容。").max(8000),
  visibility: z.enum(["private", "leader_only", "group"]).default("private"),
});

export const entryShareSchema = z.object({
  groupId: z.string().uuid(),
  entryId: z.string().uuid(),
  shareScope: z.enum(["leader_only", "group"]),
});

export const entryIdSchema = z.object({
  groupId: z.string().uuid(),
  entryId: z.string().uuid(),
});
