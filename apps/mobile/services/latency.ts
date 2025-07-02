/**
 * Determines whether to show a loader or a cached asset based on the latency budget.
 * @param latencyBudgetMs The latency budget in milliseconds.
 * @param estimatedLoadTimeMs The estimated time to load the next segment.
 * @returns 'loader' or 'cached'
 */
export const getLatencyAction = (
  latencyBudgetMs: number,
  estimatedLoadTimeMs: number
): 'loader' | 'cached' => {
  if (estimatedLoadTimeMs > latencyBudgetMs) {
    return 'loader';
  }
  return 'cached';
};

