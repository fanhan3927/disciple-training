# Supabase 数据库迁移傻瓜式操作手册

本手册用于把仓库中的数据库结构和 RLS 安全策略，推送到真实 Supabase 项目。

当前项目有 6 个迁移文件，会按编号自动执行：

```text
supabase/migrations/
├── 202607300001_m1_auth_consents.sql
├── 202607300002_m2_groups_invitations.sql
├── 202607300003_m3_courses_tasks_entries.sql
├── 202607300004_m4_discussions_prayers.sql
├── 202607300005_m5_controlled_ai.sql
└── 202607300006_m6_safety_audit_rights.sql
```

## 一、先记住 3 条安全规则

1. `SUPABASE_SERVICE_ROLE_KEY` 不是数据库密码，不能拿来执行 `supabase link`。
2. 不要把任何 key、数据库密码或 Supabase Access Token 发到聊天、提交到 GitHub 或写入文档。
3. 生产环境不要执行 `supabase db reset`。它可能清空数据库；生产迁移只使用 `supabase db push`。

## 二、打开正确的 PowerShell

按 `Win` 键，搜索并打开 **PowerShell**，然后执行：

```powershell
Set-Location "D:\ai\disciple training\AI_Discipleship_Product_Blueprint_v1.0\ai_discipleship_prd_v1"
```

确认当前目录：

```powershell
Get-Location
```

输出末尾应为：

```text
ai_discipleship_prd_v1
```

## 三、安装 Supabase CLI（Windows）

### 推荐方式：下载官方 Windows x64 版本

1. 打开官方发布页：

   <https://github.com/supabase/cli/releases/latest>

2. 在最新版本的 **Assets** 中下载：

   ```text
   supabase_*_windows_amd64.zip
   ```

   普通 Intel 或 AMD Windows 电脑选择 `amd64`。不要下载 `linux` 或 `darwin`。

3. 解压压缩包，得到 `supabase.exe`。
4. 建议把它放到：

   ```text
   C:\Tools\supabase\supabase.exe
   ```

5. 关闭当前 PowerShell，重新打开一个 PowerShell。

如果没有把目录加入系统 PATH，可以直接用完整路径验证：

```powershell
& "C:\Tools\supabase\supabase.exe" --version
```

能看到版本号就说明安装成功。

如果你已经把 `C:\Tools\supabase` 加入 PATH，也可以使用：

```powershell
supabase --version
```

> 本项目当前 Windows + Node 环境可能会出现 `npx supabase` 找不到匹配二进制包的问题。遇到这个错误时，使用上面的官方 ZIP 方式，不要反复执行 `npx supabase`。

## 四、登录 Supabase CLI

执行：

```powershell
supabase login
```

如果系统提示输入 Access Token：

1. 打开：<https://supabase.com/dashboard/account/tokens>
2. 点击 **Generate new token**。
3. 名称可以填：`disciple-training-local-cli`。
4. 复制生成的 Token。
5. 回到 PowerShell，粘贴并按回车。

粘贴 Token 时，终端通常不会显示字符，这是正常现象。

验证登录：

```powershell
supabase projects list
```

如果能看到项目列表，登录成功。

## 五、找到项目 Reference ID

不要猜项目 ID。按下面方式复制：

1. 打开 <https://supabase.com/dashboard>。
2. 进入本项目对应的 Supabase 项目。
3. 点击左下角 **Project Settings**。
4. 点击 **General**。
5. 找到 **Reference ID**，复制它。

Reference ID 一般是一串短字符串，例如：

```text
abcdefghijklmnop
```

它不是：

- Supabase URL；
- anon key；
- service role key；
- 数据库密码。

## 六、初始化本地 Supabase 配置

确保 PowerShell 仍位于项目根目录，然后执行：

```powershell
if (-not (Test-Path ".\supabase\config.toml")) {
  supabase init
}
```

如果命令询问是否创建配置，输入 `Y` 并回车。

确认配置文件存在：

```powershell
Test-Path ".\supabase\config.toml"
```

输出 `True` 即可。

## 七、绑定真实 Supabase 项目

把下面的 `YOUR_PROJECT_REF` 替换成刚才复制的 Reference ID：

```powershell
supabase link --project-ref YOUR_PROJECT_REF
```

例如：

```powershell
supabase link --project-ref abcdefghijklmnop
```

命令可能会询问数据库密码。这里输入的是：

> 创建 Supabase 项目时设置的 Postgres Database Password

不是以下任何一个：

```text
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
Supabase Access Token
```

如果忘记数据库密码，请在 Supabase Dashboard 进入：

```text
Project Settings → Database → Database Password → Reset database password
```

重置后再重新执行 `supabase link`。

## 八、执行数据库迁移

先查看本地和远程迁移状态：

```powershell
supabase migration list
```

然后推送迁移：

```powershell
supabase db push
```

如果出现确认提示：

```text
Do you want to push these migrations to the linked project?
```

输入：

```text
Y
```

等待命令完成。正常情况下会依次执行 M1 到 M6，最后显示成功信息。

## 九、验证迁移是否成功

再次执行：

```powershell
supabase migration list
```

本地迁移和远程迁移都应显示为已应用。

然后打开 Supabase Dashboard：

```text
项目 → Table Editor
```

检查是否能看到用户同意、群组、课程、讨论、祷告、AI 控制、安全审计等相关表。

最后打开线上网站：

<https://disciple-training.vercel.app>

至少手动测试：

1. 注册或登录；
2. 创建群组；
3. 打开群组详情；
4. 进入讨论或祷告页面；
5. 检查无权限访问时是否被拒绝。

## 十、常见错误处理

### 1. `supabase is not recognized`

说明 CLI 没有加入 PATH。使用完整路径执行：

```powershell
& "C:\Tools\supabase\supabase.exe" --version
```

后续把示例中的 `supabase` 都替换为：

```powershell
& "C:\Tools\supabase\supabase.exe"
```

### 2. `Access token is required`

说明 CLI 没登录。重新执行：

```powershell
supabase login
```

### 3. `Invalid project ref`

说明填的不是 Reference ID。回到：

```text
Project Settings → General → Reference ID
```

重新复制，不要复制项目 URL。

### 4. 数据库密码错误

执行 `supabase link` 时输入数据库密码，不是 API key。忘记密码就到：

```text
Project Settings → Database → Reset database password
```

### 5. `Remote migration history is behind/diverged`

先停止，不要随意执行 `--include-all`，也不要删除迁移记录。把完整错误信息保存下来，再检查：

```powershell
supabase migration list
```

已经在线上执行过的 migration 文件不能修改；需要修复时，应新增一个更大的编号 migration。

### 6. `relation does not exist`

通常表示迁移还没有完成。重新检查：

```powershell
supabase migration list
supabase db push
```

## 十一、完成标准

下面全部满足，才算迁移完成：

```text
[ ] supabase --version 能显示版本
[ ] supabase projects list 能看到项目
[ ] supabase link 已成功
[ ] supabase db push 已成功
[ ] supabase migration list 显示远程迁移已应用
[ ] Dashboard 的 Table Editor 能看到业务表
[ ] 线上登录和群组页面可以正常使用
[ ] 没有把任何 key 或密码提交到 GitHub
```

## 十二、以后发布新数据库改动

以后不要直接在生产数据库手工改表。流程固定为：

```powershell
# 1. 在代码中新增 migration 文件
# 2. 本地检查
supabase migration list

# 3. 推送到真实 Supabase
supabase db push

# 4. 再部署应用
npx vercel --prod
```

已经执行过的 migration 文件保持不变；任何新改动都新增 migration 文件。
