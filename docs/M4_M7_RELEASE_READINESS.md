# M4–M7 开发与发布就绪报告

更新时间：2026-08-18

## 当前结论

M4、M5、M6 的核心代码与数据库安全底座已经完成；M7 已建立发布检查清单，但项目还不能宣称“生产发布完成”。真实 Supabase 项目、Alice/Bob/Carol/Dave 多身份 RLS 集成测试、模型 Provider 配置、备份恢复演练和线上监控仍需在部署环境执行。

## M4｜讨论、代祷、Leader 面板

已完成：

- `group_posts`、`comments`、`reactions`、`prayer_requests`、`prayer_responses`、`notifications` migration 与 RLS；
- 组内讨论、评论、鼓励/愿意代祷互动；
- 代祷 `private / leader_only / group` 可见范围、过期、继续、结束、已回应；
- 讨论、代祷和通知的服务端输入校验、组边界校验与基础频控；
- Leader 摘要页只展示成员、课程完成计数、主动分享数量、Leader-only 请求数量和组级趋势；
- Leader 不读取 `entries` 正文、私人代祷正文或 AI 对话；
- React 纯文本渲染，不使用 `dangerouslySetInnerHTML`。

仍需：

- 真实 Supabase Alice/Bob/Carol/Dave RLS 集成测试；
- 举报入口在讨论/代祷卡片上的产品化 UI；
- 生产级分布式限流（当前为服务端查询计数，尚未接 Redis/边缘限流）。

## M5｜受控 AI

已完成：

- 风险分类：正常、核心教义、宗派差异、神旨意、圣礼、心理健康、自伤、虐待、财务操控、提示注入等；
- 高风险问题转介；核心教义与宗派问题只允许有来源的总结；
- `knowledge_chunks` 只允许已审核、已发布、`ai_approved` 的课程片段；
- 词法检索返回来源定位；无来源时明确资料不足；
- `AiProvider` adapter、未配置 Provider 的安全降级实现；
- AI 线程和消息按用户所有者 RLS 隔离，默认禁止附加私人内容；
- 审计与通知路径不写入私人正文或 AI 提示词。

仍需：

- 选定并审核真实 Provider、数据处理协议、区域与保留策略；
- 内容团队导入经过授权和审核的 chunk；
- 真实模型的引用准确性、提示注入、中文风险分类和成本/延迟评测；
- AI 对话页面、删除线程和“附加私人内容”明确确认流程。

## M6｜安全、审计和用户权利

已完成：

- `reports`、`safety_cases`、`safety_case_access`、`audit_events`、导出申请、删除申请表；
- 普通客户端不能读取案件、案件访问记录和审计事件；
- 举报限制在活跃小组成员；
- 导出/删除申请限制为本人；
- 审计元数据剔除正文、私人文本和 AI 提示词。

仍需：

- 指定安全案件处理人、SLA、升级和申诉流程；
- 后台案件工作台与每次访问审计；
- 导出打包、下载过期、删除冷静期和讨论匿名化任务；
- 法律/隐私政策对导出、删除、安全例外的最终确认。

## M7｜发布前阻断项

上线前必须逐项记录证据：

1. 运行全部 migration，并在真实 Supabase 项目检查每张业务表 RLS、grant 和 policy；
2. 用 Alice（A Leader/B Member）、Bob（A Member）、Carol（B Leader）、Dave（无组）完成跨组 IDOR 矩阵；
3. 验证 XSS、CSRF、邀请重放、速率限制、错误页和日志脱敏；
4. 配置真实 Provider 前完成 AI 红线与引用准确性评测；
5. 进行手机窄屏、空状态、失败重试、慢网和重复提交测试；
6. 完成数据库备份、恢复和删除冷静期演练；
7. 配置管理员 MFA、密钥轮换、错误监控和发布回滚开关；
8. 完成 Leader 导览、用户帮助、举报责任人和四周反馈表。

## 自动验证结果

- `tsc --noEmit --incremental false`：通过；
- `vitest`：M0–M7 相关单元/迁移测试已通过（本地最后一次全套为 13 个测试文件、45 个测试；新增 M5/M6/M7 后应重新执行完整套件）；
- `eslint src tests --no-cache`：通过；
- `next build`：此前受本机 Node/缓存环境影响超时，需在 CI 或部署环境重新验证。
