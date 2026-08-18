# MVP M1 项目基线开发总结报告

## 1. 阶段目标

本阶段执行 **M1｜认证、同意与边界**。

目标是在 M0 工程基线之上，建立用户进入产品前必须具备的身份、成人确认、法律同意、敏感数据同意和平台边界基础。

M1 完成后，用户具备以下前置流程：

- 邮箱注册；
- 邮箱登录；
- 退出登录；
- 密码恢复入口；
- 基础个人资料维护；
- 18 岁以上确认；
- 服务条款同意；
- 隐私政策同意；
- 敏感数据处理同意；
- 营销同意默认关闭；
- 未完成必需同意前阻断进入后续产品流程；
- 从公共页脚和设置页访问版本化法律、信仰和边界页面。

本阶段仍然不做：

- 小组创建；
- 邀请流程；
- 课程任务；
- 私人灵修笔记；
- 组内讨论；
- 代祷；
- Leader 面板；
- AI 问答；
- 真实课程内容导入；
- 生产部署。

## 2. 技术决策

| 决策项 | M1 结论 |
|---|---|
| 认证方案 | Supabase Auth，邮箱注册/登录 |
| 数据库 | Supabase PostgreSQL |
| 权限 | PostgreSQL Row Level Security |
| 服务端集成 | Next.js Server Actions + Supabase SSR client |
| 管理端受控写入 | Supabase service role 仅服务端使用 |
| 法律文档 | 版本化文档 + `sha256` 内容 hash |
| 成人确认 | 通过受控数据库函数写入时间 |
| 同意记录 | 通过受控数据库函数或服务端受控写入 |
| 营销同意 | 默认关闭，非必需 |
| 敏感内容 | 默认不进日志、不进 AI、不进 RAG |

## 3. 已实现内容

### 3.1 Supabase 集成

新增 Supabase 配置与客户端 helper：

- 浏览器 client；
- 服务端 SSR client；
- service role admin client；
- Supabase 环境变量配置检测；
- 未配置 Supabase 时显示明确配置提示，避免页面崩溃。

相关文件：

- `src/lib/supabase/config.ts`
- `src/lib/supabase/browser.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/admin.ts`
- `src/lib/supabase/database.types.ts`

### 3.2 数据库 migration

新增 migration：

```text
supabase/migrations/202607300001_m1_auth_consents.sql
```

创建数据表：

- `profiles`
- `legal_documents`
- `user_consents`

创建枚举：

- `legal_document_type`
- `consent_type`

创建受控函数：

- `confirm_adult_profile`
- `grant_user_consent`
- `revoke_user_consent`
- `handle_new_auth_user`

开启 RLS：

- `profiles`
- `legal_documents`
- `user_consents`

### 3.3 RLS 与权限边界

已实现的策略：

- 未登录用户不能读取 `profiles`；
- 已登录用户只能读取自己的 `profile`；
- 已登录用户只能更新自己的公开资料字段；
- 普通客户端不能直接更新 `adult_confirmed_at`；
- 已发布且未退休的法律文档可被匿名和登录用户读取；
- 已登录用户只能读取自己的同意记录；
- 普通客户端不能直接插入或更新 `user_consents`；
- 同意记录必须通过受控函数或服务端受控路径写入。

显式禁止：

- 不向客户端暴露 `service_role`；
- 不允许普通客户端伪造同意时间；
- 不允许普通客户端伪造同意文档版本；
- 不允许普通客户端直接写入同意记录。

### 3.4 认证页面

新增页面：

- `/signup`
- `/login`

注册页包含：

- 邮箱；
- 密码；
- 显示名；
- 时区；
- 18 岁以上确认；
- 服务条款必需同意；
- 隐私政策必需同意；
- 敏感数据处理必需同意；
- 营销同意可选且默认关闭。

登录页包含：

- 邮箱登录；
- 密码登录；
- 密码恢复邮件入口；
- 统一认证错误提示，避免泄露邮箱是否存在。

### 3.5 设置与进入阻断

新增登录后页面：

- `/home`
- `/settings/profile`
- `/settings/privacy`
- `/settings/data`

实现规则：

- 未登录访问登录后页面会跳转 `/login`；
- 未完成成人确认会被引导到 `/settings/profile`；
- 未完成必需同意会被引导到 `/settings/privacy`；
- 成人确认和必需同意全部完成后，才能进入 `/home`；
- `/settings/data` 提供数据导出和账号删除申请入口说明，为 M6 自助化预留。

### 3.6 版本化法律与边界页面

将 M0 占位页替换为版本化内容页面：

- `/mission`
- `/beliefs`
- `/boundaries`
- `/privacy`
- `/terms`
- `/community-guidelines`
- `/ai-notice`

每个文档包含：

- 标题；
- 文档类型；
- 版本；
- `sha256` 内容 hash；
- 摘要；
- 分节正文。

当前版本：

```text
2026-07-30.m1
```

## 4. 主要变更文件

| 路径 | 说明 |
|---|---|
| `package.json` | 新增 Supabase 相关依赖 |
| `package-lock.json` | 更新 npm lockfile |
| `supabase/migrations/202607300001_m1_auth_consents.sql` | M1 数据表、函数、RLS、初始法律文档 |
| `src/lib/supabase/config.ts` | Supabase 配置读取 |
| `src/lib/supabase/browser.ts` | 浏览器 Supabase client |
| `src/lib/supabase/server.ts` | 服务端 Supabase SSR client |
| `src/lib/supabase/admin.ts` | 服务端 service role client |
| `src/lib/supabase/database.types.ts` | M1 数据库类型 |
| `src/lib/legal-documents.ts` | 版本化法律文档定义 |
| `src/features/auth/actions.ts` | 注册、登录、退出、恢复、资料、同意 Server Actions |
| `src/features/auth/queries.ts` | 当前用户、资料、同意状态查询 |
| `src/features/auth/onboarding.ts` | 前置流程完成状态判断 |
| `src/features/auth/validation.ts` | 表单 schema |
| `src/app/(auth)/signup/page.tsx` | 注册页 |
| `src/app/(auth)/login/page.tsx` | 登录页 |
| `src/app/(app)/home/page.tsx` | 登录后入口页 |
| `src/app/(app)/settings/profile/page.tsx` | 资料与成人确认页 |
| `src/app/(app)/settings/privacy/page.tsx` | 隐私与同意页 |
| `src/app/(app)/settings/data/page.tsx` | 数据权利入口页 |
| `src/components/legal-document-page.tsx` | 版本化法律文档页面组件 |
| `tests/unit/m1-migration.test.ts` | migration 权限边界测试 |
| `tests/unit/onboarding.test.ts` | onboarding 状态测试 |
| `tests/unit/legal-documents.test.ts` | 法律文档版本/hash 测试 |
| `tests/e2e/home.spec.ts` | 首页与注册同意项 E2E 测试 |

## 5. 验证结果

已执行并通过：

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

单元测试结果：

- 5 个测试文件通过；
- 10 个单元测试通过。

测试覆盖：

- 环境变量默认值；
- 日志敏感字段脱敏；
- onboarding 必需条件；
- 法律文档版本与 `sha256` hash；
- migration 中 RLS 开启；
- migration 中禁止普通客户端直接写入同意记录；
- 成人确认必须通过受控函数。

E2E 验证：

- Playwright 移动端首页通过；
- Playwright 桌面首页通过；
- Playwright 移动端注册同意项通过；
- Playwright 桌面注册同意项通过；
- 共 4 个 E2E 用例通过。

本地访问地址：

```text
http://localhost:3100
```

## 6. 数据库迁移说明

新增 migration：

```text
supabase/migrations/202607300001_m1_auth_consents.sql
```

上线或本地 Supabase 使用前，需要将 migration 应用到目标 Supabase 数据库。

本 migration 会：

- 创建 `profiles`；
- 创建 `legal_documents`；
- 创建 `user_consents`；
- 插入 M1 初始法律文档版本；
- 开启 RLS；
- 创建用户资料自动初始化 trigger；
- 创建成人确认函数；
- 创建同意授予和撤销函数。

注意：

- `service_role` 必须只存在于服务端环境变量；
- 客户端只能使用 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`；
- 不要把真实 Supabase 密钥提交到仓库。

## 7. 安全与隐私影响

M1 已落实：

- 敏感功能默认不启用；
- AI 未接入；
- 私人内容未创建；
- 不导入课程全文；
- 不记录祷告、灵修、帖子或 AI 问答正文；
- 注册同意项明确区分必需和可选；
- 营销同意默认关闭；
- 用户同意关联具体法律文档版本和 hash；
- 成人确认只保存确认时间，不保存证件信息；
- RLS 保护 `profiles` 和 `user_consents`；
- 普通客户端不能直接写入同意记录；
- 认证错误使用通用文案，避免暴露邮箱是否存在。

仍需后续加强：

- 接入真实 Supabase 后运行数据库级 RLS 集成测试；
- 加入 CSRF/速率限制策略；
- 增加真实认证流程 E2E；
- 为管理员和安全审核角色加入 MFA 要求；
- 完成正式法律文本审阅。

## 8. 已知限制

- 当前 Supabase migration 尚未应用到远端数据库；
- 未配置真实 Supabase 环境变量时，认证页面仅显示配置提示；
- 法律文本为 M1 内测工程版本，正式上线前需要人工法务/内容确认；
- 没有实现小组邀请流程；
- 没有实现课程、任务、进度；
- 没有实现讨论、代祷、Leader 面板；
- 没有实现 AI 问答；
- 没有实现数据导出和账号删除自助化，只保留入口说明。

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

建议进入 **M2｜邀请制多小组**。

M2 目标：

- 创建 `groups`；
- 创建 `group_memberships`；
- 创建 `group_invitations`；
- 实现按小组隔离角色；
- 实现邀请生成、接受、撤销、过期和次数限制；
- 实现成员退出、Leader 移除成员、归档小组；
- 建立 Alice/Bob/Carol/Dave 权限测试矩阵；
- 确认 A 组成员无法读取 B 组数据；
- 确认 Leader 权限不跨组；
- 确认退出后立即撤权。

进入 M2 前建议人工确认：

- 是否已有 Supabase 项目；
- 是否使用本地 Supabase 进行开发测试；
- 首批 Leader 是否需要真实账号还是继续使用合成测试账号；
- 小组人数上限默认值；
- 邀请链接默认有效期；
- 邀请链接默认最大使用次数；
- Leader 盟约正式文本。

