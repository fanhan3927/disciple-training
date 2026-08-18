# ADR-002: Supabase/Postgres + RLS

## Status

Accepted

## Context

产品核心风险是跨组数据泄露和 Leader 越权查看私人内容。仅靠前端隐藏入口不能满足验收标准。

## Decision

后续业务数据使用 Supabase 托管 PostgreSQL，并为所有客户端可访问业务表开启 Row Level Security。

## Consequences

- 权限规则必须在数据库和服务端共同实现并测试。
- `service_role` 和模型密钥只允许出现在服务端环境变量中。
- M0 阶段仅预留目录、环境变量和决策记录，不创建真实业务表。
