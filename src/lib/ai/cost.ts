/**
 * AI Cost Calculation Utilities
 * 
 * Rates for OpenAI models (subject to change)
 * gpt-4o-mini:
 * - Input: $0.15 / 1M tokens
 * - Output: $0.60 / 1M tokens
 */

export const MODEL_RATES = {
    'gpt-4o-mini': {
        input: 0.15 / 1000000,
        output: 0.60 / 1000000
    },
    'gpt-4o': {
        input: 2.50 / 1000000,
        output: 10.00 / 1000000
    },
    'default': {
        input: 0.15 / 1000000,
        output: 0.60 / 1000000
    }
} as const;

export type ModelId = keyof typeof MODEL_RATES;

/**
 * Calculate the estimated cost of an AI interaction in USD
 */
export function calculateCost(
    modelId: string,
    promptTokens: number,
    completionTokens: number
): number {
    const rates = MODEL_RATES[modelId as ModelId] || MODEL_RATES.default;
    const cost = (promptTokens * rates.input) + (completionTokens * rates.output);
    return Number(cost.toFixed(6));
}
