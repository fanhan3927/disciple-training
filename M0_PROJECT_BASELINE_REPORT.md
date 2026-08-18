# MVP M0 项目基线开发总结报告

## 1. 阶段目标

本阶段执行 `09_Codex可执行开发任务书.md` 中的 **M0｜项目基线**，目标是在不开发业务功能的前提下，建立可运行、可验证、可继续迭代的 Web/PWA 工程基础。

本阶段明确不做：

- 不实现登录、注册、认证流程；
- 不创建小组、邀请、课程、数据库业务表；
- 不接入 Supabase 远端项目；
- 不接入 AI 模型或 RAG；
- 不导入课程全文、经文译文、图片、诗歌或外链；
- 不部署生产环境。

## 2. 技术决策

| 决策项 | M0 结论 |
|---|---|
| 前端/服务端框架 | Next.js App Router + TypeScript |
| 项目类型 | 全栈单体 Web/PWA 基线 |
| UI 基线 | Tailwind CSS，移动端优先 |
| 图标 | lucide-react |
| 环境变量校验 | Zod schema |
| 单元测试 | Vitest + Testing Library |
| E2E 测试 | Playwright |
| 后续数据库 | Supabase PostgreSQL + RLS |
| 后续认证 | Supabase Auth |
| 后续 AI | 服务端 Provider Adapter，默认关闭 |
| 目录结构 | Feature-first，按业务域逐步扩展 |

## 3. 已实现内容

### 3.1 工程初始化

- 初始化 `package.json`；
- 配置 Next.js 14；
- 配置 TypeScript 严格模式；
- 配置 Tailwind CSS；
- 配置 ESLint；
- 配置 Prettier；
- 生成 `package-lock.json`；
- 创建 `.gitignore`；
- 创建 `.env.example`，未写入真实密钥。

### 3.2 质量工具

- 增加 lint 命令；
- 增加 typecheck 命令；
- 增加 Vitest 单元测试；
- 增加 Playwright E2E 测试；
- 增加 GitHub Actions CI 基线；
- 增加日志脱敏测试辅助函数。

### 3.3 UI 基线

- 创建移动端优先公共布局；
- 创建首页；
- 创建公共页脚；
- 创建以下公共页面占位：
  - `/mission`
  - `/beliefs`
  - `/boundaries`
  - `/privacy`
  - `/terms`
  - `/community-guidelines`
- 创建基础 UI 组件：
  - `BoundaryBadge`
  - `VisibilityScope`
  - `EmptyState`
  - `LoadingSkeleton`
  - `StaticInfoPage`

### 3.4 文档与架构记录

- 创建 `docs/adr`；
- 创建 `docs/product`；
- 复制项目内受控产品文档副本：
  - `01_产品使命与信仰宣言.md`
  - `07_正式PRD.md`
  - `08_数据库与技术架构.md`
- 增加 ADR：
  - `ADR-001-web-pwa.md`
  - `ADR-002-supabase-postgres-rls.md`
  - `ADR-003-feature-first-structure.md`
  - `ADR-004-private-content-not-rag.md`
  - `ADR-005-no-public-community.md`

### 3.5 后续目录占位

- `src/features/`
- `src/server/`
- `supabase/migrations/`
- `supabase/seed/`
- `content/schemas/`
- `content/approved/`

这些目录仅作为后续阶段入口，M0 未创建真实业务逻辑。

## 4. 主要变更文件

| 路径 | 说明 |
|---|---|
| `package.json` | 项目脚本、依赖和开发依赖 |
| `package-lock.json` | npm lockfile |
| `next.config.mjs` | Next.js 配置 |
| `tsconfig.json` | TypeScript 严格配置 |
| `tailwind.config.ts` | Tailwind 主题与扫描路径 |
| `vitest.config.ts` | 单元测试配置 |
| `playwright.config.ts` | E2E 测试配置 |
| `.env.example` | 环境变量示例 |
| `.github/workflows/ci.yml` | CI 基线 |
| `src/app/layout.tsx` | 根布局 |
| `src/app/(public)/layout.tsx` | 公共页面布局 |
| `src/app/(public)/page.tsx` | 首页 |
| `src/components/*` | 基础 UI 组件 |
| `src/lib/env.ts` | 环境变量 schema |
| `src/lib/privacy/redaction.ts` | 日志脱敏辅助 |
| `tests/unit/*` | 单元测试 |
| `tests/e2e/home.spec.ts` | 首页 E2E 烟雾测试 |
| `docs/adr/*` | 架构决策记录 |
| `docs/product/*` | 产品文档副本 |

## 5. 验证结果

已执行并通过：

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

单元测试结果：

- `tests/unit/env.test.ts` 通过；
- `tests/unit/redaction.test.ts` 通过；
- 共 2 个测试通过。

E2E 验证结果：

- Playwright Chromium 已安装；
- 首页在移动端视口通过；
- 首页在桌面视口通过；
- 共 2 个 E2E 用例通过。

说明：

- 本机已有服务占用 `3000` 端口，因此项目开发端口调整为 `3100`；
- 当前开发服务器地址为 `http://localhost:3100`。

## 6. 数据库迁移

本阶段没有数据库迁移。

原因：

- M0 仅建立工程与质量基线；
- 认证、同意、profiles、legal documents、RLS 等数据库内容将在 M1 开始创建；
- 不提前创建未验证的业务表，避免绕过权限和隐私设计。

## 7. 安全与隐私影响

本阶段已落实的安全/隐私基线：

- `.env.example` 不包含真实密钥；
- AI、讨论、代祷、数据导出等功能开关默认关闭；
- 增加日志脱敏辅助函数，覆盖邮箱、密码、token、API key、正文、祷告、反思、AI 问答等字段；
- UI 文案明确当前阶段不启用业务功能；
- ADR 明确私人内容不得进入 RAG；
- ADR 明确 MVP 不建设公开社区；
- 后续数据库方案要求 Supabase/Postgres RLS。

本阶段未产生真实用户数据、课程正文、祷告内容、AI 对话或授权材料全文。

## 8. 已知限制

- 公共法律/信仰页面目前是可访问占位页，不是正式版本化法律文档；
- 尚未接入 Supabase Auth；
- 尚未创建数据库 schema、migration 或 RLS policy；
- 尚未实现小组、课程、任务、讨论、代祷、Leader 面板或 AI；
- `npm run test:e2e` 默认假设 `http://localhost:3100` 已有服务运行；
- 若需要 Playwright 自动管理 dev server，可后续继续优化 Windows 下的进程退出行为。

## 9. 运行方式

安装依赖：

```bash
npm install
```

启动本地开发服务器：

```bash
npm run dev
```

访问地址：

```text
http://localhost:3100
```

执行质量检查：

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

E2E 测试：

```bash
npm run test:e2e
```

## 10. 下一阶段建议

建议进入 **M1｜认证、同意与边界**。

M1 应优先完成：

1. Supabase 初始化；
2. `profiles`、`legal_documents`、`user_consents` migration；
3. RLS 默认拒绝；
4. 邮箱注册、登录、退出、恢复；
5. 成人确认；
6. 服务条款、隐私、敏感数据处理同意；
7. 法律与信仰页面正式版本化；
8. 未完成必需同意时禁止继续进入小组流程。

进入 M1 前仍需人工确认：

- 产品正式中文/英文名称；
- 域名和视觉标识；
- 法律文档正式版本文本；
- 授权文件覆盖范围；
- 首发圣经译本或 YouVersion 接入策略。

