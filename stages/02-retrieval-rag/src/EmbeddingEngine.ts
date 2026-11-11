/**
 * EmbeddingEngine: Computes high-dimensional dense vector representations and geometric distances.
 * Implements unit-norm vector projections and cosine similarity calculations.
 */

export class EmbeddingEngine {
  public readonly dimensions: number;

  /**
   * Initializes embedding engine with target vector dimensionality.
   * 
   * @param dimensions - Vector space dimensions (default: 64 for efficient in-memory indexing).
   */
  constructor(dimensions = 64) {
    this.dimensions = dimensions;
  }

  /**
   * Generates a normalized dense vector embedding from text.
   * Uses semantic n-gram feature hashing with L2 unit normalization.
   * 
   * @param text - The input string to embed.
   * @returns Float64Array representing a unit-normalized embedding vector.
   */
  public embed(text: string): Float64Array {
    const vector = new Float64Array(this.dimensions);
    const cleaned = text.toLowerCase().trim();
    if (!cleaned) return vector;

    const words = cleaned.split(/\W+/).filter(Boolean);
    const ngrams: string[] = [];

    // Unigrams and Bigrams for semantic local context
    for (let i = 0; i < words.length; i++) {
      ngrams.push(words[i]);
      if (i < words.length - 1) {
        ngrams.push(`${words[i]}_${words[i + 1]}`);
      }
    }

    // Hash each n-gram into vector dimensions
    for (const term of ngrams) {
      let hash = 0x811c9dc5;
      for (let i = 0; i < term.length; i++) {
        hash ^= term.charCodeAt(i);
        hash = (hash * 0x01000193) >>> 0;
      }
      const dim = hash % this.dimensions;
      const sign = (hash & 1) === 0 ? 1.0 : -1.0;
      vector[dim] += sign;
    }

    // L2 Normalize the vector to unit length for fast cosine similarity via dot product
    let normSq = 0;
    for (let i = 0; i < this.dimensions; i++) {
      normSq += vector[i] * vector[i];
    }

    if (normSq > 0) {
      const norm = Math.sqrt(normSq);
      for (let i = 0; i < this.dimensions; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }

  /**
   * Computes the Cosine Similarity between two unit-normalized vectors.
   * Since vectors are L2-normalized, Cosine Similarity equals the Dot Product:
   * sim(A, B) = A · B ∈ [-1.0, 1.0].
   * 
   * @param vecA - First unit vector.
   * @param vecB - Second unit vector.
   * @returns Cosine similarity score.
   */
  public cosineSimilarity(vecA: Float64Array, vecB: Float64Array): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Dimension mismatch between vectors');
    }

    let dot = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
    }
    return dot;
  }
}

