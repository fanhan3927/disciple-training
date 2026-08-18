# ADR-004: 私人内容不进入 RAG

## Status

Accepted

## Context

产品宪章明确要求私人灵修、代祷和 AI 对话默认仅本人可见，且不得自动发送给 AI。

## Decision

课程 RAG 只允许使用已发布、已审核且 `ai_approved` 的课程内容块。私人记录、帖子、评论、代祷和 AI 对话不进入课程知识库。

## Consequences

- AI 功能必须通过 Provider Adapter 和受控检索实现。
- 每次附加私人上下文前都需要用户当次确认。
- 日志与测试夹具不能保存敏感正文。
