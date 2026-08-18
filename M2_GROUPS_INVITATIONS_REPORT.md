# MVP M2 项目基线开发总结报告

## 1. 阶段目标

本阶段执行 **M2｜邀请制多小组**。

目标是在 M1 认证、成人确认与同意基础之上，建立熟人小组的最小闭环，并通过数据库 RLS 与服务端权限逻辑共同保障多小组隔离。

M2 完成后，用户具备以下能力：

- 完成 M1 onboarding 后进入小组区域；
- Leader 创建小组；
- Leader 编辑小组基础信息；
- Leader 接受 Leader 盟约；
- Leader 生成限时、限次邀请；
- 受邀用户打开邀请预览；
- 受邀用户接受邀请并加入小组；
- 用户查看自己的多个小组；
- 用户进入当前小组详情；
- Leader 查看本组成员；
- Leader 移除本组成员；
- 成员主动退出小组；
- Leader 归档小组；
- 邀请撤销、过期或达到使用上限后不可继续使用。

本阶段仍然不做：

- 课程内容导入；
- 每日任务；
- 私人灵修记录；
- 组内讨论；
- 代祷；
- Leader 进度面板；
- AI 问答；
- 数据导出 ZIP；
- 公开社区或公开小组目录。

## 2. 技术决策

| 决策项 | M2 结论 |
|---|---|
| 数据库 | Supabase PostgreSQL |
| 权限 | PostgreSQL RLS + 服务端权限校验 |
| 小组模型 | `groups` + `group_memberships` |
| 邀请模型 | `group_invitations`，只保存 token hash |
| Token 处理 | 原始 token 仅创建时显示，数据库保存 `sha256` |
| 角色隔离 | 用户角色按 `group_id` 隔离 |
| 服务端实现 | Next.js Server Actions |
| 页面结构 | App Router 路由组 |
| 测试策略 | migration 静态测试 + 权限矩阵单元测试 + E2E 烟雾测试 |

## 3. 已实现内容

### 3.1 数据库 migration

新增 migration：

```text
supabase/migrations/202607300002_m2_groups_invitations.sql
```

创建枚举：

- `group_role`
- `membership_status`
- `group_lifecycle_status`
- `group_safety_status`

创建数据表：

- `groups`
- `group_memberships`
- `group_invitations`

创建函数：

- `is_active_group_member`
- `is_group_leader`
- `active_group_leader_count`
- `prevent_last_leader_removal`

创建 trigger：

- `groups_touch_updated_at`
- `group_memberships_touch_updated_at`
- `group_memberships_prevent_last_leader_removal`

开启 RLS：

- `groups`
- `group_memberships`
- `group_invitations`

### 3.2 小组数据模型

`groups` 支持：

- 小组名称；
- 描述；
- 时区；
- 人数上限；
- 生命周期状态；
- 安全状态；
- 创建者；
- 创建、更新、归档时间。

`group_memberships` 支持：

- 用户与小组的多对多关系；
- 按小组隔离的角色；
- 成员状态；
- 邀请人；
- 加入时间；
- 退出时间；
- Leader 盟约版本；
- Leader 盟约接受时间。

`group_invitations` 支持：

- 小组邀请；
- token hash；
- 被授予角色；
- 过期时间；
- 最大使用次数；
- 已使用次数；
- 创建者；
- 撤销时间。

### 3.3 RLS 与权限边界

已实现策略：

- 活跃成员可以读取自己所在小组；
- Leader 可以更新自己小组基础信息；
- 非成员不能读取小组；
- 活跃成员可以读取本组成员列表；
- 成员可以将自己状态改为 `left`；
- Leader 可以管理本组成员状态；
- 其他组 Leader 不能管理本组；
- Leader 可以查看本组邀请；
- 普通成员不能创建或管理邀请；
- 客户端不能直接插入邀请；
- 邀请 token hash 不对普通客户端公开；
- 活跃小组不能移除唯一 Leader。

显式禁止：

- 不创建公开小组目录；
- 无邀请不能加入小组；
- 不在数据库保存原始邀请 token；
- 不允许 Leader 权限跨组；
- 不允许普通客户端直接写入邀请；
- 不允许移除活跃小组的唯一 Leader。

### 3.4 小组领域逻辑

新增小组领域模块：

- `src/features/groups/actions.ts`
- `src/features/groups/queries.ts`
- `src/features/groups/permissions.ts`
- `src/features/groups/token.ts`
- `src/features/groups/validation.ts`
- `src/features/groups/constants.ts`

实现服务端动作：

- `createGroupAction`
- `updateGroupAction`
- `archiveGroupAction`
- `createInvitationAction`
- `acceptInvitationAction`
- `revokeInvitationAction`
- `removeMemberAction`
- `leaveGroupAction`

实现权限工具：

- `canManageGroup`
- `canReadGroup`
- `canManageMembership`
- `canUseInvitation`
- `isLeaderRole`
- `isActiveMember`

实现 token 工具：

- `createInvitationToken`
- `hashInvitationToken`

### 3.5 页面与流程

新增页面：

- `/groups`
- `/groups/new`
- `/groups/[groupId]`
- `/groups/[groupId]/members`
- `/groups/[groupId]/settings`
- `/invite/[token]`

已实现流程：

1. 完成 M1 onboarding 的用户进入 `/groups`；
2. 无小组时显示空状态；
3. 用户创建第一个小组并成为 Leader；
4. 创建小组时必须确认 Leader 盟约；
5. Leader 在小组详情页创建邀请；
6. 原始邀请链接只在创建后显示一次；
7. 邀请预览只显示必要信息；
8. 邀请预览不显示成员列表；
9. 登录用户接受邀请后加入小组；
10. 用户可以查看自己的小组列表；
11. Leader 可以查看和移除本组成员；
12. 用户可以退出小组；
13. Leader 可以归档小组。

### 3.6 类型扩展

更新 Supabase 类型：

- `GroupRole`
- `MembershipStatus`
- `GroupLifecycleStatus`
- `GroupSafetyStatus`
- `groups`
- `group_memberships`
- `group_invitations`
- 小组相关 RPC 类型。

相关文件：

```text
src/lib/supabase/database.types.ts
```

## 4. 主要变更文件

| 路径 | 说明 |
|---|---|
| `supabase/migrations/202607300002_m2_groups_invitations.sql` | M2 小组、成员、邀请、RLS、trigger |
| `src/lib/supabase/database.types.ts` | M2 数据库类型扩展 |
| `src/features/groups/constants.ts` | 小组和邀请默认配置 |
| `src/features/groups/validation.ts` | 小组、邀请、成员操作 schema |
| `src/features/groups/token.ts` | 邀请 token 生成和 hash |
| `src/features/groups/permissions.ts` | 小组权限判断 |
| `src/features/groups/queries.ts` | 小组、成员、邀请预览查询 |
| `src/features/groups/actions.ts` | 小组和邀请 Server Actions |
| `src/components/group-role-badge.tsx` | 小组角色标签 |
| `src/app/(app)/groups/page.tsx` | 我的小组页 |
| `src/app/(app)/groups/new/page.tsx` | 创建小组页 |
| `src/app/(app)/groups/[groupId]/page.tsx` | 小组详情页 |
| `src/app/(app)/groups/[groupId]/members/page.tsx` | 成员列表页 |
| `src/app/(app)/groups/[groupId]/settings/page.tsx` | 小组设置页 |
| `src/app/(public)/invite/[token]/page.tsx` | 邀请预览页 |
| `tests/unit/m2-migration.test.ts` | M2 migration 静态测试 |
| `tests/unit/groups-permissions.test.ts` | Alice/Bob/Carol/Dave 权限矩阵测试 |
| `tests/unit/groups-token.test.ts` | 邀请 token/hash 测试 |
| `tests/e2e/home.spec.ts` | 小组与邀请无配置状态 E2E |

## 5. 验证结果

已执行并通过：

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

单元测试结果：

- 8 个测试文件通过；
- 20 个单元测试通过。

测试覆盖：

- M1 migration 权限边界；
- M2 migration 中小组表创建；
- M2 migration 中 RLS 开启；
- M2 migration 中邀请 hash 约束；
- M2 migration 中禁止客户端直接插入邀请；
- 防止移除唯一 Leader；
- 无公开小组目录策略；
- Alice/Bob/Carol/Dave 权限矩阵；
- 邀请撤销、过期、达到上限判断；
- 邀请 token 生成和 hash；
- onboarding 状态；
- 法律文档版本和 hash；
- 日志脱敏。

E2E 验证：

- 移动端首页通过；
- 桌面首页通过；
- 移动端注册同意项通过；
- 桌面注册同意项通过；
- 移动端小组页未配置状态通过；
- 桌面小组页未配置状态通过；
- 移动端无效邀请页不泄露成员通过；
- 桌面无效邀请页不泄露成员通过；
- 共 8 个 E2E 用例通过。

本地访问地址：

```text
http://localhost:3100
```

## 6. 数据库迁移说明

新增 migration：

```text
supabase/migrations/202607300002_m2_groups_invitations.sql
```

应用顺序：

1. 先应用 M1 migration；
2. 再应用 M2 migration。

M2 migration 依赖 M1 中已有的：

- `auth.users`
- `profiles`
- `touch_updated_at`

应用后应确认：

- `groups` RLS 已开启；
- `group_memberships` RLS 已开启；
- `group_invitations` RLS 已开启；
- 普通客户端无 `insert` 权限写入 `group_invitations`；
- 邀请 `token_hash` 符合 `sha256:<64 hex>` 格式；
- 活跃小组不能移除唯一 Leader。

## 7. 安全与隐私影响

M2 已落实：

- 无公开小组目录；
- 无邀请不能加入小组；
- 邀请 token 只保存 hash；
- 原始 token 只创建时显示一次；
- 邀请预览不显示成员列表；
- 小组成员关系按 `group_id` 隔离；
- Leader 权限只在本组生效；
- 退出或移除后成员状态变更为非 active；
- RLS 只允许活跃成员读取本组；
- 活跃小组不能移除唯一 Leader；
- 不记录邀请原始 token、祷告、反思、AI 问答或敏感正文；
- 不引入公开社区、公开祷告墙或陌生人匹配。

仍需后续加强：

- 接入真实 Supabase 后执行数据库级 RLS 集成测试；
- 增加邀请 token 并发使用的数据库事务保护；
- 将移除成员、归档小组、撤销邀请写入 audit trail；
- 增加速率限制；
- 增加邀请创建数量限制；
- 增加管理员和安全审核角色；
- 完成 Leader 盟约正式文本确认。

## 8. 已知限制

- M2 migration 尚未应用到真实 Supabase 数据库；
- 当前未配置真实 Supabase 环境时，页面只显示配置提示；
- 邀请链接没有邮件发送功能；
- 原始邀请链接当前显示为本地 `http://localhost:3100/invite/...`；
- 邀请接受流程依赖用户已登录；
- 暂未实现 co-leader 移交流程；
- 暂未实现 observer 专属 UI；
- 暂未实现审计记录；
- 暂未实现真实数据库级越权集成测试；
- 暂未实现课程、任务、进度、讨论、代祷、Leader 面板和 AI。

## 9. 运行方式

安装依赖：

```bash
npm install
```

启动本地开发服务器：

```bash
npm run dev
```

访问：

```text
http://localhost:3100
```

质量验证：

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

E2E 验证：

```bash
npm run test:e2e
```

## 10. 下一阶段建议

建议进入 **M3｜课程、任务与私人记录**。

M3 目标：

- 创建课程内容模型；
- 创建课程版本模型；
- 创建模块、课次、内容块；
- 创建班次和课次解锁；
- 创建任务和完成记录；
- 导入首发四周课程的产品化内容；
- 不导入未经确认的经文正文、图片、诗歌或外链；
- 每个内容块保留来源定位；
- 建立私人记录 `entries` 和分享表 `content_shares`；
- 默认私人；
- 用户可主动分享给本组或仅 Leader；
- Leader 不能读取私人正文；
- 删除和撤回后普通接口不可读。

进入 M3 前建议人工确认：

- 《新生活》前四课是否已完成版权授权；
- 课程内容是否允许产品化改编；
- 课程内容是否允许 AI/RAG 使用；
- 神学审核负责人；
- 版权审核负责人；
- 首发课程标题是否采用“新生活重启营”；
- 每周任务数量；
- 每日任务解锁规则；
- 是否只显示经文引用而不显示译文正文；
- 私人记录是否需要应用层字段加密。

