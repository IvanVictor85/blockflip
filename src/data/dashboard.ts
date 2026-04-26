// ─── Mock Dashboard Data ──────────────────────────────────────────────────────
// Realistic data for pitch/demo purposes.

export interface PortfolioProperty {
  id: string;
  name: string;
  location: string;
  status: 'funding' | 'reforming' | 'selling' | 'completed';
  invested: number;       // USDC invested
  currentValue: number;   // Current estimated value
  targetRoi: number;      // Target ROI %
  realizedRoi?: number;   // Realized ROI % (completed deals)
  projectProgress: number; // 0-100
  fundingProgress: number;  // 0-100
  tokenSymbol: string;
  expectedReturn: number;  // Expected payout in USDC
  daysRemaining?: number;
  completedAt?: string;
  imageUrl: string;        // Unsplash property photo URL
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'investment' | 'yield' | 'withdrawal';
  description: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending';
  txHash: string;
}

export interface DashboardSummary {
  totalInvested: number;
  portfolioValue: number;
  totalYield: number;
  yieldPct: number;
  activeDeals: number;
  completedDeals: number;
}

// ─── Summary ──────────────────────────────────────────────────────────────────

export const mockSummary: DashboardSummary = {
  totalInvested:  6_500,
  portfolioValue: 7_228,
  totalYield:       728,
  yieldPct:        11.2,
  activeDeals:        2,
  completedDeals:     1,
};

// ─── Portfolio ────────────────────────────────────────────────────────────────

export const mockPortfolio: PortfolioProperty[] = [
  {
    id:              'prop-001',
    name:            'Loft Alto de Pinheiros',
    location:        'Pinheiros, São Paulo — SP',
    status:          'reforming',
    invested:         2_500,
    currentValue:     2_712,
    targetRoi:           28,
    projectProgress:     65,
    fundingProgress:    100,
    tokenSymbol:     'BFLP-001',
    expectedReturn:   3_200,
    daysRemaining:       48,
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
  },
  {
    id:              'prop-002',
    name:            'Cobertura Barra da Tijuca',
    location:        'Barra da Tijuca, Rio de Janeiro — RJ',
    status:          'funding',
    invested:         1_000,
    currentValue:     1_016,
    targetRoi:           24,
    projectProgress:      8,
    fundingProgress:     78,
    tokenSymbol:     'BFLP-002',
    expectedReturn:   1_240,
    daysRemaining:      112,
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
  },
  {
    id:              'prop-003',
    name:            'Flat Moema Premium',
    location:        'Moema, São Paulo — SP',
    status:          'completed',
    invested:         3_000,
    currentValue:     3_930,
    targetRoi:           31,
    realizedRoi:         31,
    projectProgress:    100,
    fundingProgress:    100,
    tokenSymbol:     'BFLP-000',
    expectedReturn:   3_930,
    completedAt:     '2026-03-14',
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
  },
];

// ─── Transactions ─────────────────────────────────────────────────────────────

export const mockTransactions: Transaction[] = [
  {
    id: 'tx-006',
    type: 'yield',
    description: 'Yield — Flat Moema Premium (liquidação final)',
    amount:  930,
    date: '2026-03-14',
    status: 'completed',
    txHash: '5K9mXv2NpQ3rT8wY1zA4bC7dE0fG6hJ2kL5nM8pR1sU4vW7',
  },
  {
    id: 'tx-005',
    type: 'deposit',
    description: 'Depósito USDC — Carteira',
    amount: 5_000,
    date: '2026-02-01',
    status: 'completed',
    txHash: '3H7kNv0MqP2sT5wX8yB1cD4eF7gI0jK3lN6pQ9rS2uV5xZ8',
  },
  {
    id: 'tx-004',
    type: 'investment',
    description: 'Investimento — Cobertura Barra da Tijuca',
    amount: -1_000,
    date: '2026-02-15',
    status: 'completed',
    txHash: '8J2lPv4OqN6rS9wZ1yA4bD7eG0hK3mM6nP9rT2vX5zA8cE1',
  },
  {
    id: 'tx-003',
    type: 'investment',
    description: 'Investimento — Loft Alto de Pinheiros',
    amount: -2_500,
    date: '2026-02-20',
    status: 'completed',
    txHash: '2F6iMv8LpO0qR3uX6yC9dG2hJ5kL8nN1pS4vY7zA0bD3eH6',
  },
  {
    id: 'tx-002',
    type: 'yield',
    description: 'Yield Parcial — Flat Moema Premium',
    amount: 450,
    date: '2026-01-20',
    status: 'completed',
    txHash: '7G1jLv3KoP5qR8tW1xB4cF7gI0jL3nM6oQ9sV2wY5zA8dE1',
  },
  {
    id: 'tx-001',
    type: 'investment',
    description: 'Investimento — Flat Moema Premium',
    amount: -3_000,
    date: '2025-11-10',
    status: 'completed',
    txHash: '4C8gKv6JmN8pQ1tV4xA7bE0fH3iK6lN9oR2uW5yZ8aD1eG4',
  },
];
