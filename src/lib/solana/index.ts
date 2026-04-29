/**
 * BlockFlip — Solana Contract Interface (Mock Layer)
 *
 * Este módulo serve como a camada de contrato para o frontend.
 * Atualmente retorna dados simulados para desenvolvimento.
 *
 * SUBSTITUIR em produção por chamadas reais ao programa Anchor:
 *   - Program ID: a ser definido no deploy
 *   - IDL: gerado pelo `anchor build`
 *   - Instruções: invest(), claimReturn(), cancelPosition()
 */

import { InvestmentResult, InvestmentErrorType } from '@/types';
import { simulateDelay } from '@/lib/mock-data';

// ─── Constantes do Protocolo ──────────────────────────────────────────────────

export const PROTOCOL_FEE_BPS = 100; // 1% em basis points
export const TOKENS_PER_USDC = 1;    // 1 token por USDC (simplificado na v1)
export const SOLANA_EXPLORER_BASE = 'https://explorer.solana.com/tx';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Calcula taxas e tokens a receber dado um valor em USDC. */
export function calculateInvestmentFees(amountUsdc: number) {
  const protocolFee = parseFloat((amountUsdc * (PROTOCOL_FEE_BPS / 10_000)).toFixed(2));
  const total = parseFloat((amountUsdc + protocolFee).toFixed(2));
  const tokensReceived = amountUsdc * TOKENS_PER_USDC;
  return { capital: amountUsdc, protocolFee, total, tokensReceived };
}

/** Gera uma assinatura de transação mock para desenvolvimento. */
function mockTxSignature(assetId: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  const rand = Array.from({ length: 44 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `MOCK_${assetId.toUpperCase()}_${rand}`;
}

/** URL do Solana Explorer para uma transação. */
export function getExplorerTxUrl(signature: string, cluster: 'mainnet' | 'devnet' = 'devnet'): string {
  const param = cluster === 'devnet' ? '?cluster=devnet' : '';
  return `${SOLANA_EXPLORER_BASE}/${signature}${param}`;
}

// SECURITY FIX (High): Tabnapping prevention.
// window.open(..., '_blank') without 'noopener,noreferrer' allows the opened page
// to access window.opener and redirect the original tab to a phishing page.
const ALLOWED_OPEN_HOSTNAMES = [
  'explorer.solana.com',
  'solscan.io',
  'images.unsplash.com',
];

export function openExternalUrl(url: string): void {
  try {
    const { hostname } = new URL(url);
    const isAllowed = ALLOWED_OPEN_HOSTNAMES.some(
      (h) => hostname === h || hostname.endsWith(`.${h}`)
    );
    if (!isAllowed) {
      console.warn('[BlockFlip][Security] Blocked external URL:', hostname);
      return;
    }
  } catch {
    return; // invalid URL
  }
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ─── Mock: Verificação de Saldo ───────────────────────────────────────────────

/**
 * [MOCK] Verifica se a wallet possui saldo USDC suficiente.
 * Produção: consultar SPL Token account via @solana/web3.js getTokenAccountBalance()
 */
export async function checkWalletBalance(
  walletAddress: string,
  requiredUsdc: number
): Promise<{ sufficient: boolean; balance: number }> {
  await simulateDelay(600);
  // Mock: simula saldo de $100.000 USDC para testes de fluxo de sucesso
  const mockBalance = 100_000;
  return {
    sufficient: mockBalance >= requiredUsdc,
    balance: mockBalance,
  };
}

// ─── Mock: Verificação de Cap ─────────────────────────────────────────────────

/**
 * [MOCK] Verifica se o ativo ainda possui capacidade de captação.
 * Produção: consultar estado da conta do programa on-chain.
 */
export async function checkFundingCap(
  assetId: string,
  amountUsdc: number
): Promise<{ available: boolean; remainingCapacity: number }> {
  await simulateDelay(400);
  // Mock: retorna capacidade disponível para testes
  const mockRemaining = assetId === 'asset-003' ? 0 : 50_000;
  return {
    available: mockRemaining >= amountUsdc,
    remainingCapacity: mockRemaining,
  };
}

// ─── Mock: Instrução de Investimento ─────────────────────────────────────────

/**
 * [MOCK] Executa o aporte de USDC e emite tokens RWA fracionários.
 *
 * Produção (Anchor):
 *   const tx = await program.methods
 *     .invest(new BN(amountUsdc * 1_000_000)) // USDC tem 6 decimais
 *     .accounts({
 *       investor: wallet.publicKey,
 *       assetPool: getAssetPoolPDA(assetId),
 *       investorTokenAccount: getATAAddress(wallet.publicKey, assetMint),
 *       usdcMint: USDC_MINT,
 *       tokenProgram: TOKEN_2022_PROGRAM_ID,
 *       systemProgram: SystemProgram.programId,
 *     })
 *     .rpc();
 *   await confirmTransaction(connection, tx);
 *
 * @throws {InvestmentErrorType} — erros tipados para a UI
 */
export async function handleInvest(params: {
  assetId: string;
  walletAddress: string;
  amountUsdc: number;
}): Promise<InvestmentResult> {
  const { assetId, walletAddress, amountUsdc } = params;

  // Simula latência de assinatura na wallet
  await simulateDelay(1_200);

  // Simula 3% de chance de rejeição pelo usuário (teste de UX)
  if (Math.random() < 0.03) {
    const err: { type: InvestmentErrorType; message: string } = {
      type: 'user_rejected',
      message: 'Transação cancelada na wallet.',
    };
    throw err;
  }

  // Simula latência de confirmação on-chain (1-3 blocos Solana ≈ 400-1200ms)
  await simulateDelay(800);

  const { tokensReceived } = calculateInvestmentFees(amountUsdc);
  const txSignature = mockTxSignature(assetId);

  console.info('[BlockFlip][handleInvest] Mock TX confirmada:', {
    assetId,
    wallet: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
    amountUsdc,
    txSignature: txSignature.slice(0, 20) + '...',
  });

  return {
    success: true,
    txSignature,
    amountUsdc,
    tokensReceived,
    assetId,
    timestamp: new Date().toISOString(),
  };
}

// ─── Mock: Cancelar Posição ───────────────────────────────────────────────────

/**
 * [MOCK] Cancela posição em ativo ainda em fase de captação.
 * Produção: instrução Anchor cancelPosition() com burn dos tokens.
 */
export async function handleCancelPosition(params: {
  assetId: string;
  walletAddress: string;
  tokenAmount: number;
}): Promise<{ success: boolean; txSignature: string }> {
  await simulateDelay(1_000);
  return {
    success: true,
    txSignature: mockTxSignature(params.assetId),
  };
}
