/**
 * ModelRouter: Dynamically routes incoming prompts between Economy and Frontier models.
 * Evaluates semantic complexity, reasoning markers, token lengths, and structure
 * to maximize cost savings without compromising output quality.
 */

export interface RouterConfig {
  economyModel: string;
  frontierModel: string;
  tokenComplexityThreshold?: number;
}

export interface RoutingDecision {
  selectedModel: string;
  isFrontier: boolean;
  reason: string;
  estimatedComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class ModelRouter {
  private readonly config: RouterConfig;
  private readonly tokenThreshold: number;

  private static readonly COMPLEXITY_KEYWORDS = [
    'compare',
    'synthesize',
    'analyze',
    'architect',
    'step-by-step',
    'evaluate',
    'trade-off',
    'tradeoff',
    'critique',
    'debug',
    'refactor',
    'algorithm',
    'mathematical',
    'derivation',
  ];

  /**
   * Initializes model router with model identifiers and routing thresholds.
   * 
   * @param config - Economy and frontier model definitions.
   */
  constructor(config: RouterConfig) {
    this.config = config;
    this.tokenThreshold = config.tokenComplexityThreshold ?? 120;
  }

  /**
   * Evaluates prompt characteristics and routes to the optimal model tier.
   * 
   * @param prompt - Inbound prompt string.
   * @returns RoutingDecision with selected model and classification justification.
   */
  public route(prompt: string): RoutingDecision {
    const cleaned = prompt.toLowerCase();
    const tokenEstimate = Math.ceil(prompt.length / 4);

    // Rule 1: High token volume prompts require large context window reasoning
    if (tokenEstimate > this.tokenThreshold) {
      return {
        selectedModel: this.config.frontierModel,
        isFrontier: true,
        reason: `High token volume (${tokenEstimate} tokens > ${this.tokenThreshold} threshold)`,
        estimatedComplexity: 'HIGH',
      };
    }

    // Rule 2: Multi-step reasoning or technical analysis keywords
    const matchedKeywords = ModelRouter.COMPLEXITY_KEYWORDS.filter((kw) =>
      cleaned.includes(kw)
    );
    if (matchedKeywords.length >= 2) {
      return {
        selectedModel: this.config.frontierModel,
        isFrontier: true,
        reason: `Complex reasoning keywords detected: [${matchedKeywords.join(', ')}]`,
        estimatedComplexity: 'HIGH',
      };
    }

    // Rule 3: Code blocks or multi-line schema definitions
    if (prompt.includes('```') || prompt.includes('class ') || prompt.includes('interface ')) {
      return {
        selectedModel: this.config.frontierModel,
        isFrontier: true,
        reason: 'Code structures or architectural definitions detected in prompt',
        estimatedComplexity: 'MEDIUM',
      };
    }

    // Default fast-path: Economy tier for lookups, extractions, greetings, and short queries
    return {
      selectedModel: this.config.economyModel,
      isFrontier: false,
      reason: 'Standard query: routed to economy model for optimal cost and latency',
      estimatedComplexity: 'LOW',
    };
  }
}

