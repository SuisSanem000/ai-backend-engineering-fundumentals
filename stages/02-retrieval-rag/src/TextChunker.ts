/**
 * TextChunker: Sliding-window document chunking utility with token overlap
 * and sentence-boundary preservation to prevent semantic context fragmentation.
 */

export interface Chunk {
  chunkId: string;
  docId: string;
  index: number;
  content: string;
  estimatedTokens: number;
  metadata?: Record<string, unknown>;
}

export interface ChunkerOptions {
  chunkTokenSize: number;
  overlapTokens: number;
}

export class TextChunker {
  private readonly chunkSize: number;
  private readonly overlap: number;

  /**
   * Constructs a chunker with specific token budget and overlap targets.
   * 
   * @param options - Chunk size in tokens and overlap margin in tokens.
   */
  constructor(options?: Partial<ChunkerOptions>) {
    this.chunkSize = options?.chunkTokenSize ?? 100;
    this.overlap = options?.overlapTokens ?? 20;

    if (this.overlap >= this.chunkSize) {
      throw new Error('Overlap must be strictly smaller than chunk size');
    }
  }

  /**
   * Chunks a document into overlapping segments, preserving sentence boundaries where possible.
   * 
   * @param docId - Unique identifier of the source document.
   * @param text - Raw full-text document content.
   * @param metadata - Document-level metadata to propagate to chunks.
   * @returns Array of structured Chunk objects.
   */
  public chunkDocument(
    docId: string,
    text: string,
    metadata?: Record<string, unknown>
  ): Chunk[] {
    if (!text || text.trim().length === 0) return [];

    // Split text into approximate sentence segments
    const sentences = text
      .replace(/\r\n/g, '\n')
      .split(/(?<=[.?!])\s+|\n\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const chunks: Chunk[] = [];
    let currentChunkSentences: string[] = [];
    let currentTokens = 0;
    let chunkIndex = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const sentenceTokens = Math.ceil(sentence.length / 4);

      if (currentTokens + sentenceTokens > this.chunkSize && currentChunkSentences.length > 0) {
        // Emit current chunk
        const content = currentChunkSentences.join(' ');
        chunks.push({
          chunkId: `${docId}:chunk_${chunkIndex++}`,
          docId,
          index: chunks.length,
          content,
          estimatedTokens: currentTokens,
          metadata,
        });

        // Compute overlap: retain trailing sentences matching overlap budget
        let overlapTokensAcc = 0;
        const overlapSentences: string[] = [];
        for (let j = currentChunkSentences.length - 1; j >= 0; j--) {
          const s = currentChunkSentences[j];
          const st = Math.ceil(s.length / 4);
          if (overlapTokensAcc + st <= this.overlap) {
            overlapSentences.unshift(s);
            overlapTokensAcc += st;
          } else {
            break;
          }
        }

        currentChunkSentences = [...overlapSentences];
        currentTokens = overlapTokensAcc;
      }

      currentChunkSentences.push(sentence);
      currentTokens += sentenceTokens;
    }

    if (currentChunkSentences.length > 0) {
      const content = currentChunkSentences.join(' ');
      chunks.push({
        chunkId: `${docId}:chunk_${chunkIndex}`,
        docId,
        index: chunks.length,
        content,
        estimatedTokens: currentTokens,
        metadata,
      });
    }

    return chunks;
  }
}

