/**
 * BM25Index: Sparse inverted index implementing the Okapi BM25 scoring algorithm.
 * Provides exact keyword matching, term frequency saturation, and document length normalization.
 */

import { Chunk } from './TextChunker.ts';
import { SearchMatch, MetadataFilter } from './VectorStore.ts';

export class BM25Index {
  private readonly k1: number;
  private readonly b: number;
  private readonly chunks = new Map<string, Chunk>();
  private readonly docLengths = new Map<string, number>();
  private readonly invertedIndex = new Map<string, Map<string, number>>();
  private totalLength = 0;

  /**
   * Initializes BM25 index with Okapi calibration constants.
   * 
   * @param k1 - Term frequency saturation parameter (default: 1.2).
   * @param b - Document length penalty parameter (default: 0.75).
   */
  constructor(k1 = 1.2, b = 0.75) {
    this.k1 = k1;
    this.b = b;
  }

  /**
   * Tokenizes text into lowercase alphanumeric terms.
   */
  private tokenize(text: string): string[] {
    return text.toLowerCase().match(/[a-z0-9_]+/g) || [];
  }

  /**
   * Indexes a single chunk into the inverted index.
   * 
   * @param chunk - Chunk to index.
   */
  public addChunk(chunk: Chunk): void {
    const tokens = this.tokenize(chunk.content);
    const docId = chunk.chunkId;
    const len = tokens.length;

    this.chunks.set(docId, chunk);
    this.docLengths.set(docId, len);
    this.totalLength += len;

    const tfMap = new Map<string, number>();
    for (const token of tokens) {
      tfMap.set(token, (tfMap.get(token) || 0) + 1);
    }

    for (const [term, freq] of tfMap.entries()) {
      let postings = this.invertedIndex.get(term);
      if (!postings) {
        postings = new Map<string, number>();
        this.invertedIndex.set(term, postings);
      }
      postings.set(docId, freq);
    }
  }

  /**
   * Bulk indexes an array of chunks.
   */
  public addChunks(chunks: Chunk[]): void {
    for (const c of chunks) {
      this.addChunk(c);
    }
  }

  /**
   * Searches the inverted index using BM25 scoring.
   * 
   * @param queryText - Search query string.
   * @param topK - Maximum matches to return.
   * @param filter - Optional metadata filter predicate.
   * @returns Ranked array of SearchMatch objects.
   */
  public search(queryText: string, topK = 5, filter?: MetadataFilter): SearchMatch[] {
    const queryTokens = this.tokenize(queryText);
    if (queryTokens.length === 0 || this.chunks.size === 0) return [];

    const N = this.chunks.size;
    const avgDocLength = this.totalLength / N;
    const docScores = new Map<string, number>();

    for (const term of queryTokens) {
      const postings = this.invertedIndex.get(term);
      if (!postings) continue;

      // Inverse Document Frequency with smoothing
      const df = postings.size;
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));

      for (const [chunkId, freq] of postings.entries()) {
        const chunk = this.chunks.get(chunkId)!;
        if (filter && !filter(chunk.metadata)) {
          continue;
        }

        const docLen = this.docLengths.get(chunkId) || avgDocLength;
        const norm = 1 - this.b + this.b * (docLen / avgDocLength);
        const termScore = idf * ((freq * (this.k1 + 1)) / (freq + this.k1 * norm));

        docScores.set(chunkId, (docScores.get(chunkId) || 0) + termScore);
      }
    }

    const matches: SearchMatch[] = [];
    for (const [chunkId, score] of docScores.entries()) {
      matches.push({ chunk: this.chunks.get(chunkId)!, score });
    }

    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, topK);
  }
}

