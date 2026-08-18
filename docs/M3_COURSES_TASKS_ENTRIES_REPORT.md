# M3 课程、任务与私人记录安全修复报告

## 本次继续开发完成内容

- 补齐课程任务写入的跨组边界校验：请求组、班次所属组、课程版本、课次和任务必须属于同一条关系链，且班次必须为 active。
- 已发布课程版本和 active 课程才会被成员读取。
- 课次在 `unlock_at` 之前不可通过页面或猜测 URL 读取。
- 课程内容块只读取神学、版权和安全审核均为 `approved` 的内容。
- 共享记录读取过滤撤回、删除和过期记录。
- `content_shares` 作为每个目标小组的实际可见性来源，支持同一记录以不同范围分享给多个小组。
- 分享写入失败时回退记录的展示状态，避免出现“页面显示已分享但没有分享授权”的不一致。
- 数据库 RLS 同步限制未发布班次和过期/撤回分享。
- 班次创建校验日历日期、课程版本发布状态和课程 active 状态。
- 排期生成改为幂等 upsert，排期失败会清理刚创建的空班次。
- 未解锁课次在周页面显示锁定卡片，不再提供会返回 404 的链接。

## 变更文件

- `src/features/courses/authorization.ts`
- `src/features/courses/actions.ts`
- `src/features/courses/queries.ts`
- `supabase/migrations/202607300003_m3_courses_tasks_entries.sql`
- `tests/unit/course-authorization.test.ts`
- `tests/unit/m3-migration.test.ts`

## 验证结果

- `npm.cmd exec vitest -- run --no-cache --no-file-parallelism --maxWorkers=1`：35/35 通过。
- `npm.cmd exec tsc -- --noEmit --incremental false`：通过。
- `npm.cmd exec eslint -- . --no-cache`：通过。
- `npm.cmd run build`：在 180 秒内未完成，未获得构建结论；本地存在旧 Node 进程和构建缓存权限问题，需要单独清理/复查环境后重跑。

## 已知限制

- 目前仍没有真实 Supabase 数据库上的 Alice/Bob/Carol/Dave 集成权限测试。
- Server Action 仍使用 service-role 写入，因此每个新增动作都必须保持显式归属校验；后续应优先改为安全 RPC 或补充数据库集成测试。
- 课程内容仍是产品化摘要 seed，不包含未经确认授权的经文译文正文、图片、诗歌或外链。
