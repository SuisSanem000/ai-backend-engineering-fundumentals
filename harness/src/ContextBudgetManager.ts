/**
 * ContextBudgetManager: Enforces deterministic token budget allocations across
 * the four critical quadrants of an LLM prompt:
 * 1. System Prompt (invariant instructions)
 * 2. Injected RAG Context (external retrieved knowledge)
 * 3. Conversation History (sliding window of multi-turn dialogue)
 * 4. Completion Reservation (reserved headroom for model output)
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
}

export interface BudgetConfig {
  totalWindowLimit: number;
  reservedCompletionTokens: number;
  maxSystemTokens: number;
  maxRagContextTokens: number;
}

export class ContextBudgetManager {
  private readonly config: BudgetConfig;

  /**
   * Initializes the budget manager with strict token allocation ceilings.
   * @param config - Token limit specifications for the target model.
   */
  constructor(config: BudgetConfig) {
    this.config = config;
  }

  /**
   * Fast, conservative token estimator (standard heuristic: ~4 characters per token).
   * @param text - The raw text content to estimate.
   * @returns Conservative integer count of estimated tokens.
   */
  public estimateTokens(text: string): number {
    if (!text || text.length === 0) return 0;
    return Math.ceil(text.length / 4);
  }

  /**
   * Estimates total token count across an array of chat messages.
   * @param messages - Array of chat messages.
   * @returns Total estimated token count.
   */
  public estimateMessagesTokens(messages: ChatMessage[]): number {
    return messages.reduce((acc, msg) => acc + this.estimateTokens(msg.content) + 4, 0);
  }

  /**
   * Truncates external RAG context text if it exceeds the allocated RAG budget.
   * Uses middle truncation to preserve both beginning context and end citations.
   * @param ragContext - Raw injected context string.
   * @returns Truncated context fitting within the allocated token budget.
   */
  public fitRagContext(ragContext: string): string {
    const estimated = this.estimateTokens(ragContext);
    if (estimated <= this.config.maxRagContextTokens) {
      return ragContext;
    }

    const maxChars = this.config.maxRagContextTokens * 4;
    const half = Math.floor(maxChars / 2) - 20;
    const head = ragContext.slice(0, half);
    const tail = ragContext.slice(ragContext.length - half);

    return `${head}\n... [TRUNCATED ${estimated - this.config.maxRagContextTokens} TOKENS] ...\n${tail}`;
  }

  /**
   * Fits conversation history into the remaining budget using sliding window eviction (oldest first).
   * Ensures the system prompt and latest user prompt are never dropped.
   * @param systemPrompt - The top-level system instruction.
   * @param ragContext - Optional retrieved knowledge text.
   * @param history - Conversation history messages.
   * @returns Budget-compliant array of messages ready for model invocation.
   */
  public fitConversation(
    systemPrompt: string,
    ragContext: string,
    history: ChatMessage[]
  ): { messages: ChatMessage[]; droppedCount: number } {
    const fittedRag = this.fitRagContext(ragContext);
    const systemTokens = this.estimateTokens(systemPrompt);
    const ragTokens = this.estimateTokens(fittedRag);

    const availableForHistory =
      this.config.totalWindowLimit -
      this.config.reservedCompletionTokens -
      systemTokens -
      ragTokens;

    if (availableForHistory <= 0) {
      throw new Error(
        `ContextBudgetViolation: System prompt (${systemTokens} tokens) and RAG (${ragTokens} tokens) exceed total budget without space for history or output.`
      );
    }

    const compiledMessages: ChatMessage[] = [];
    let currentTokens = 0;
    let droppedCount = 0;

    // Traverse from newest to oldest to preserve recent dialogue recency
    const reversed = [...history].reverse();
    const preservedReversed: ChatMessage[] = [];

    for (const msg of reversed) {
      const msgTokens = this.estimateTokens(msg.content) + 4;
      if (currentTokens + msgTokens <= availableForHistory) {
        preservedReversed.push(msg);
        currentTokens += msgTokens;
      } else {
        droppedCount++;
      }
    }

    const preservedHistory = preservedReversed.reverse();

    // Assemble final prompt sequence
    const finalSystemContent = fittedRag
      ? `${systemPrompt}\n\n[RETRIEVED CONTEXT]:\n${fittedRag}`
      : systemPrompt;

    compiledMessages.push({ role: 'system', content: finalSystemContent });
    compiledMessages.push(...preservedHistory);

    return {
      messages: compiledMessages,
      droppedCount,
    };
  }
}

