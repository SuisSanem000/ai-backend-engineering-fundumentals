/**
 * ToolRegistry: Centralized registry for agent tool contracts.
 * Enforces Zod argument validation, risk level checks, and idempotency key requirements.
 */

import { ToolDefinition, ActionRiskLevel } from './AgentTypes.ts';
import { IdempotencyStore } from './IdempotencyStore.ts';

export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition<any, any>>();
  private readonly idempotencyStore: IdempotencyStore;

  /**
   * Initializes the tool registry bound to an idempotency store.
   * 
   * @param idempotencyStore - Store for caching idempotent actions.
   */
  constructor(idempotencyStore?: IdempotencyStore) {
    this.idempotencyStore = idempotencyStore ?? new IdempotencyStore();
  }

  /**
   * Registers a strongly-typed tool definition.
   * 
   * @param tool - Tool definition object.
   */
  public registerTool<TArgs, TResult>(tool: ToolDefinition<TArgs, TResult>): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Retrieves a tool by name.
   */
  public getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * Executes a tool with input schema validation and idempotency protection.
   * 
   * @param name - Target tool name.
   * @param rawArgs - Unvalidated input arguments.
   * @param idempotencyKey - Optional unique idempotency key for side-effects.
   * @returns Tool execution result (or cached result if key exists).
   */
  public async executeTool(
    name: string,
    rawArgs: unknown,
    idempotencyKey?: string
  ): Promise<{ result: unknown; isIdempotentReplay: boolean }> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`ToolNotFoundError: Unknown tool '${name}'`);
    }

    // 1. Schema validation
    const parsedArgs = tool.schema.parse(rawArgs);

    // 2. Idempotency validation
    if (tool.requiresIdempotencyKey) {
      if (!idempotencyKey) {
        throw new Error(
          `IdempotencyKeyRequired: Tool '${name}' mutates state and requires a unique idempotencyKey`
        );
      }

      const cached = this.idempotencyStore.get(idempotencyKey);
      if (cached) {
        return { result: cached.result, isIdempotentReplay: true };
      }
    }

    // 3. Execution
    const result = await tool.execute(parsedArgs, idempotencyKey);

    // 4. Cache mutation result
    if (tool.requiresIdempotencyKey && idempotencyKey) {
      this.idempotencyStore.set(idempotencyKey, name, result);
    }

    return { result, isIdempotentReplay: false };
  }

  /**
   * Returns metadata descriptions for all registered tools (for system prompt generation).
   */
  public getToolDescriptions(): Array<{ name: string; description: string; riskLevel: ActionRiskLevel }> {
    return Array.from(this.tools.values()).map((t) => ({
      name: t.name,
      description: t.description,
      riskLevel: t.riskLevel,
    }));
  }
}
