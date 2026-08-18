# Supabase 与部署配置

## 当前状态

代码已经推送到 `agent/m4-m7-release`，Draft PR 为 #1。仓库内已加入无密钥 CI：`.github/workflows/ci.yml`。

真实 Supabase 项目和生产托管账号尚未绑定。不要把 service role key、AI API key 或 Vercel token 提交到 Git。

## Supabase

1. 在 Supabase 创建一个新项目，保存 Project URL、anon public key 和 service role key。
2. 在本地安装 Supabase CLI 并登录：

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
```

3. 首次部署数据库迁移：

```bash
npx supabase db push
```

4. 在部署平台配置：

```text
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
NEXT_PUBLIC_APP_URL=<production-url>
```

5. 迁移完成后，用 Alice、Bob、Carol、Dave 四个测试身份验证跨组 RLS。不要直接把生产 service role key 放进浏览器变量或 `NEXT_PUBLIC_*`。

## Vercel（推荐）

在 Vercel 导入 `fanhan3927/disciple-training`，生产分支选择 `main`，构建命令使用 `npm run build`，安装命令使用 `npm ci`。将上面的四个变量添加到 Preview 和 Production 对应环境。

首次上线前：

```bash
npx vercel login
npx vercel link
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
npx vercel env add NEXT_PUBLIC_APP_URL production
npx vercel --prod
```

输入密钥时通过 CLI 的隐藏输入或 Vercel 控制台填写，不要把值写入命令历史、日志或仓库。

## 上线检查

- GitHub Actions 的 typecheck、lint、56 个单元测试和 production build 全部通过；
- Supabase migrations 全部执行成功；
- 真实 RLS 身份矩阵通过；
- 生产环境不启用未配置的 AI；
- 备份、恢复、错误监控和回滚方案已验证；
- 讨论举报负责人和安全案件处理流程已确定。
