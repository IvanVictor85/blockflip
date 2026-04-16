// Re-exports mock data with network delay simulation
// Structure mirrors the future on-chain data schema

export { mockAssets, mockUnitEconomics, formatCurrency, formatPercentage } from '@/data/mock-assets';

/**
 * Simulates realistic network delay for mock API calls.
 * Remove in production when connecting to real RPC.
 */
export const simulateDelay = (ms: number = 600): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetches a single asset by ID with simulated latency.
 */
export async function getMockAsset(id: string) {
  const { mockAssets } = await import('@/data/mock-assets');
  await simulateDelay(400);
  return mockAssets.find((a) => a.id === id) ?? null;
}

/**
 * Simulates submitting an investment intent.
 * In production, this becomes a Solana transaction.
 */
export async function submitMockInvestment(assetId: string, amountUsdc: number) {
  await simulateDelay(1200);
  // Simulate 5% chance of failure for realistic UX testing
  if (Math.random() < 0.05) {
    throw new Error('Transação simulada falhou. Tente novamente.');
  }
  return {
    success: true,
    txHash: `MOCK_${Date.now()}_${assetId}`,
    amountUsdc,
  };
}
