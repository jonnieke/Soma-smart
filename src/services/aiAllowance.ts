export type AiAllowance = { plan?: string; limit?: number; usageCount?: number };

// Only explicit allowance failures carry billing information; provider capacity errors do not.
export function parseAiAllowance(value: unknown): AiAllowance | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const data = value as Record<string, unknown>;
  if (data.code !== 'FEATURE_LIMIT_REACHED' && data.code !== 'PLAN_LIMIT_REACHED') return undefined;
  const finiteCount = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : undefined;
  return {
    plan: typeof data.plan === 'string' ? data.plan.toUpperCase() : undefined,
    limit: finiteCount(data.limit), usageCount: finiteCount(data.usageCount),
  };
}

export function getAiAllowance(error: unknown): AiAllowance | undefined {
  if (!error || typeof error !== 'object') return undefined;
  return (error as { allowance?: AiAllowance }).allowance;
}
