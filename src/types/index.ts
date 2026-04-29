export type AssetStatus = 'arremate' | 'em_reforma' | 'venda';

export interface BuildMilestone {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending';
  completedAt?: string;
  evidenceHash?: string;
  evidenceType?: 'photo' | 'video' | 'document';
}

export interface PropertyDocument {
  id: string;
  title: string;
  type: 'edital_leilao' | 'matricula' | 'cronograma_obra' | 'laudo_tecnico' | 'certidoes';
  url: string;
  uploadedAt: string;
  verified: boolean;
  hash?: string;
}

export interface Asset {
  id: string;
  title: string;
  location: string;
  imageUrl: string;
  status: AssetStatus;
  acquisitionPrice: number;
  targetSalePrice: number;
  estimatedROI: number;
  cycleDays: number;
  currentDay: number;
  fundingGoal: number;
  fundingRaised: number;
  fundingCurrency: 'USDC';
  milestones: BuildMilestone[];
  tokenSymbol: string;
  totalTokens: number;
  minInvestment: number;
  // Blockchain transparency fields
  smartContractAddress: string;
  speAddress: string; // Sociedade de Propósito Específico address
  verificationStatus: 'verified' | 'pending' | 'unverified';
  documents: PropertyDocument[];
  // On-chain investment fields (present only for real pools from localStorage)
  poolId?: number;
  poolVault?: string;
  acceptedMint?: string;
  investorAta?: string;
  // Cost breakdown (present for pools created after cost-breakdown feature)
  operationType?: 'AUCTION' | 'DIRECT_PURCHASE';
  acquisitionCost?: number;
  renovationCost?: number;
  legalCost?: number;
}

// ─── Investment Flow State Machine ───────────────────────────────────────────

export type InvestmentStep =
  | 'idle'               // Modal fechado / não iniciado
  | 'amount_entry'       // Usuário digitando o valor
  | 'validation'         // Validando input com Zod
  | 'wallet_check'       // Verificando se wallet está conectada
  | 'awaiting_signature' // Aguardando aprovação na wallet (Phantom/Backpack)
  | 'confirming_on_chain'// TX submetida — aguardando confirmação Solana
  | 'success'            // TX confirmada com sucesso
  | 'error';             // Erro com tipo descritivo

export type InvestmentErrorType =
  | 'insufficient_balance'   // Saldo USDC insuficiente
  | 'wallet_not_connected'   // Nenhuma wallet detectada
  | 'user_rejected'          // Usuário cancelou na wallet
  | 'rpc_error'              // Falha de comunicação com o nó Solana
  | 'funding_complete'       // Ativo já atingiu o cap de captação
  | 'below_minimum'          // Valor abaixo do mínimo do ativo
  | 'validation_failed'      // Schema Zod falhou
  | 'unknown';               // Erro não categorizado

export interface InvestmentError {
  type: InvestmentErrorType;
  message: string;       // Mensagem amigável para o usuário
  technical?: string;    // Detalhe técnico para logs (nunca exibir ao usuário)
}

export interface InvestmentFees {
  capital: number;       // Valor aportado pelo investidor (USDC)
  protocolFee: number;   // Fee do protocolo BlockFlip (1%)
  total: number;         // capital + protocolFee
  tokensReceived: number;// Estimativa de tokens RWA recebidos
}

export interface InvestmentState {
  step: InvestmentStep;
  amountUsdc: number;
  fees: InvestmentFees | null;
  txSignature: string | null;  // Hash da transação após confirmação
  error: InvestmentError | null;
}

export interface InvestmentResult {
  success: boolean;
  txSignature: string;
  amountUsdc: number;
  tokensReceived: number;
  assetId: string;
  timestamp: string;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface UnitEconomicsData {
  acquisitionCost: number;
  reformCost: number;
  operationalCost: number;
  totalCost: number;
  targetSalePrice: number;
  grossProfit: number;
  netProfit: number;
  investorShare: number;
  protocolFee: number;
}
