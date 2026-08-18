# ADR-003: Feature-first 目录结构

## Status

Accepted

## Context

MVP 后续会按 auth、groups、courses、entries、discussions、prayers、ai、safety 逐阶段交付。

## Decision

采用 feature-first 结构：跨功能通用代码放入 `src/lib` 和 `src/components`，业务功能放入 `src/features`。

## Consequences

- 每个里程碑可以独立扩展，减少跨模块改动。
- 服务端授权、输入验证和隐私工具集中放在共享库中。
