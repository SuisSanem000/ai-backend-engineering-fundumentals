/**
 * CostCalculator: Computes real-time USD cost per LLM invocation based on model pricing tiers.
 * Provides immutable audit receipts for observability, billing, and margin protection.
 */

export interface ModelPricingTier {
  modelName: string;
  inputCostPerMillion: number;  // Price in USD per 1,000,000 prompt tokens
  outputCostPerMillion: number; // Price in USD per 1,000,000 completion tokens
}

export interface CostReceipt {
  requestId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  promptCostUsd: number;
  completionCostUsd: number;
  totalCostUsd: number;
  timestamp: number;
}

export class CostCalculator {
  private static readonly PRICING_CATALOG: Record<string, ModelPricingTier> = {
    'gemini-1.5-pro': {
      modelName: 'gemini-1.5-pro',
      inputCostPerMillion: 3.5,
      outputCostPerMillion: 10.5,
    },
    'gemini-1.5-flash': {
      modelName: 'gemini-1.5-flash',
      inputCostPerMillion: 0.075,
      outputCostPerMillion: 0.30,
    },
    'gpt-4o': {
      modelName: 'gpt-4o',
      inputCostPerMillion: 2.5,
      outputCostPerMillion: 10.0,
    },
    'gpt-4o-mini': {
      modelName: 'gpt-4o-mini',
      inputCostPerMillion: 0.15,
      outputCostPerMillion: 0.60,
    },
    'claude-3-5-sonnet': {
      modelName: 'claude-3-5-sonnet',
      inputCostPerMillion: 3.0,
      outputCostPerMillion: 15.0,
    },
  };

  /**
   * Registers or updates a model pricing tier in the global catalog.
   * 
   * @param tier - Pricing configuration for a specific model name.
   */
  public static registerModel(tier: ModelPricingTier): void {
    CostCalculator.PRICING_CATALOG[tier.modelName.toLowerCase()] = tier;
  }

  /**
   * Generates an immutable CostReceipt calculating exact financial cost for an invocation.
   * 
   * @param requestId - Unique correlation ID of the request.
   * @param model - Model identifier string.
   * @param promptTokens - Number of input tokens processed.
   * @param completionTokens - Number of output tokens generated.
   * @returns Detailed CostReceipt with sub-cent precision.
   */
  public static calculateCost(
    requestId: string,
    model: string,
    promptTokens: number,
    completionTokens: number
  ): CostReceipt {
    const tier = CostCalculator.PRICING_CATALOG[model.toLowerCase()] || {
      modelName: model,
      inputCostPerMillion: 1.0,
      outputCostPerMillion: 3.0,
    };

    const promptCost = (promptTokens / 1_000_000) * tier.inputCostPerMillion;
    const completionCost = (completionTokens / 1_000_000) * tier.outputCostPerMillion;
    const totalCost = promptCost + completionCost;

    return {
      requestId,
      model,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      promptCostUsd: Number(promptCost.toFixed(6)),
      completionCostUsd: Number(completionCost.toFixed(6)),
      totalCostUsd: Number(totalCost.toFixed(6)),
      timestamp: Date.now(),
    };
  }
}
