# ADR-001: Web/PWA 而非原生 App

## Status

Accepted

## Context

MVP 首发对象是海外 3-5 个熟人小组，目标是在 20-40 人规模内快速验证四周学习闭环。原生 iOS/Android 会增加发布、审核和维护成本。

## Decision

使用 Next.js App Router + TypeScript 构建 Web/PWA 形态，先交付移动端优先体验。

## Consequences

- 可以用单一代码库覆盖公共页面、服务端 API 和后续 PWA 能力。
- 原生推送、深度系统集成和应用商店分发推迟到 P1/P2 后评估。
