/**
 * EmbeddingEngine: Computes high-dimensional dense vector representations and geometric distances.
 * Implements sub-word character n-gram feature hashing (FastText/WordPiece style)
 * with L2 unit normalization for robust semantic and morphological matching.
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
   * Uses word and sub-word character n-gram feature hashing with L2 unit normalization.
   * 
   * @param text - The input string to embed.
   * @returns Float64Array representing a unit-normalized embedding vector.
   */
  public embed(text: string): Float64Array {
    const vector = new Float64Array(this.dimensions);
    const cleaned = text.toLowerCase().trim();
    if (!cleaned) return vector;

    const words = cleaned.split(/\W+/).filter(Boolean);
    const features: string[] = [];

    // Word tokens and sub-word character 3-grams / 4-grams for morphological similarity
    for (const w of words) {
      features.push(`w:${w}`);
      if (w.length >= 3) {
        for (let i = 0; i <= w.length - 3; i++) {
          features.push(`c3:${w.slice(i, i + 3)}`);
        }
      }
      if (w.length >= 4) {
        for (let i = 0; i <= w.length - 4; i++) {
          features.push(`c4:${w.slice(i, i + 4)}`);
        }
      }
    }

    // Hash each feature into vector dimensions (Murmur/FNV-style hash)
    for (const term of features) {
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
