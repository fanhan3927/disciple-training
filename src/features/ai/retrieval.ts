export type KnowledgeChunk = { id: string; text: string; sourceLocator: string; reviewed: boolean };
export type RankedKnowledgeChunk = KnowledgeChunk & { score: number };

export function rankKnowledgeChunks(query: string, chunks: KnowledgeChunk[], limit = 5): RankedKnowledgeChunk[] {
  const terms = (query.match(/[a-z0-9]+|[\u4e00-\u9fff]{2}/gi) ?? query.toLowerCase().split(/\s+/)).map((term) => term.toLowerCase()).filter(Boolean);
  return chunks.filter((chunk) => chunk.reviewed && chunk.text.trim() && chunk.sourceLocator.trim()).map((chunk) => {
    const haystack = chunk.text.toLowerCase();
    return { ...chunk, score: terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0) };
  }).filter((chunk) => chunk.score > 0).sort((a, b) => b.score - a.score || a.sourceLocator.localeCompare(b.sourceLocator)).slice(0, limit);
}
