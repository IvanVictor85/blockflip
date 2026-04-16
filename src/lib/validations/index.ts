import { z } from 'zod';

// OWASP: Injection — All user inputs must be validated with Zod before processing

/**
 * Schema for investment intent form.
 * Validates amount, wallet, and asset before any on-chain action.
 */
export const investmentSchema = z.object({
  assetId: z.string().min(1, 'ID do ativo é obrigatório'),
  walletAddress: z
    .string()
    .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'Endereço de wallet Solana inválido'),
  amountUsdc: z
    .number()
    .positive('O valor deve ser positivo')
    .min(50, 'Investimento mínimo é $50 USDC')
    .max(1_000_000, 'Valor excede o limite por transação'),
});

/**
 * Schema for contact / newsletter form.
 */
export const contactSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(100),
  message: z.string().max(1000, 'Mensagem muito longa').optional(),
});

/**
 * Schema for asset filtering in the marketplace.
 */
export const assetFilterSchema = z.object({
  status: z.enum(['all', 'arremate', 'em_reforma', 'venda']).default('all'),
  minRoi: z.number().min(0).max(100).optional(),
  maxPrice: z.number().positive().optional(),
});

export type InvestmentInput = z.infer<typeof investmentSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type AssetFilterInput = z.infer<typeof assetFilterSchema>;
