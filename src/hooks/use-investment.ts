'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useWallet } from '@solana/wallet-adapter-react';
import { investmentSchema } from '@/lib/validations';
import {
  calculateInvestmentFees,
  checkWalletBalance,
  checkFundingCap,
  handleInvest,
  getExplorerTxUrl,
} from '@/lib/solana';
import { useBlockFlip } from '@/hooks/useBlockFlip';
import type {
  InvestmentState,
  InvestmentStep,
  InvestmentError,
  InvestmentErrorType,
  InvestmentFees,
} from '@/types';

// ─── Real-pool blockchain params ──────────────────────────────────────────────

export interface BlockchainInvestParams {
  poolId: number;
  poolVault: string;
  investorTokenAccount: string;
}

// ─── Estado inicial ───────────────────────────────────────────────────────────

const INITIAL_STATE: InvestmentState = {
  step: 'idle',
  amountUsdc: 0,
  fees: null,
  txSignature: null,
  error: null,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useInvestment(
  assetId: string,
  minInvestment: number,
  blockchainParams?: BlockchainInvestParams
) {
  const t = useTranslations('investment');
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toString() ?? null;

  // Real Anchor invest (only used when blockchainParams present)
  const { invest: anchorInvest } = useBlockFlip();

  const [state, setState] = useState<InvestmentState>(INITIAL_STATE);

  const errorMessage = useCallback(
    (type: InvestmentErrorType): string => t(`errors.${type}`),
    [t]
  );

  const transition = useCallback((step: InvestmentStep, patch: Partial<InvestmentState> = {}) => {
    setState((prev) => ({ ...prev, step, error: null, ...patch }));
  }, []);

  const setError = useCallback((type: InvestmentErrorType, technical?: string) => {
    const error: InvestmentError = {
      type,
      message: errorMessage(type),
      technical,
    };
    setState((prev) => ({ ...prev, step: 'error', error }));
    console.error(`[BlockFlip][useInvestment] Error(${type}):`, technical ?? error.message);
  }, [errorMessage]);

  // ─── Amount change ────────────────────────────────────────────────────────

  const onAmountChange = useCallback(
    (raw: string) => {
      const amount = parseFloat(raw) || 0;
      transition('amount_entry', { amountUsdc: amount, fees: null });
      if (amount > 0) {
        const fees: InvestmentFees = calculateInvestmentFees(amount);
        setState((prev) => ({ ...prev, fees }));
      }
    },
    [transition]
  );

  // ─── Submit ───────────────────────────────────────────────────────────────

  const submit = useCallback(async () => {
    const { amountUsdc } = state;

    // ── wallet check (FIRST) ──────────────────────────────────────────────
    transition('wallet_check');

    if (!walletAddress) {
      setError('wallet_not_connected');
      toast.error(t('errorTitle'), { description: errorMessage('wallet_not_connected') });
      return;
    }

    // ── validation ────────────────────────────────────────────────────────
    transition('validation');

    const parsed = investmentSchema.safeParse({
      assetId,
      walletAddress,
      amountUsdc,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? t('errors.validation_failed');
      setError('validation_failed', firstIssue);
      toast.error(t('errorTitle'), { description: firstIssue });
      return;
    }

    // ── Real on-chain invest ──────────────────────────────────────────────
    if (blockchainParams) {
      if (!blockchainParams.poolVault || !blockchainParams.investorTokenAccount) {
        setError('rpc_error', 'Missing vault or ATA address for this pool');
        toast.error('Pool incompleta', {
          description: 'Vault ou ATA não encontrados. Recrie a infraestrutura de tokens.',
        });
        return;
      }

      transition('awaiting_signature');
      const toastId = toast.loading(t('stepAwaitingSignature'), {
        description: 'Phantom · Backpack · Solflare',
      });

      try {
        transition('confirming_on_chain');
        toast.loading(t('stepConfirming'), { id: toastId, description: '~400ms' });

        const sig = await anchorInvest(
          blockchainParams.poolId,
          amountUsdc,
          blockchainParams.investorTokenAccount
        );

        transition('success', { txSignature: sig });
        toast.dismiss(toastId);
        toast.success(t('successTitle'), {
          description: `Aporte de ${amountUsdc.toLocaleString('pt-BR')} tokens confirmado on-chain.`,
          action: {
            label: t('viewOnExplorer'),
            onClick: () => window.open(getExplorerTxUrl(sig), '_blank'),
          },
          duration: 8_000,
        });
      } catch (err: unknown) {
        toast.dismiss(toastId);
        const msg = (err as Error)?.message ?? '';

        // "already processed" = tx landed on-chain on a previous attempt — treat as success
        if (msg.includes('already been processed')) {
          const match = msg.match(/[1-9A-HJ-NP-Za-km-z]{87,88}/);
          const recoveredSig = match ? match[0] : '';
          transition('success', { txSignature: recoveredSig });
          toast.info('Transação já processada', {
            description: 'Aporte confirmado on-chain em tentativa anterior.',
            duration: 6_000,
          });
          return;
        }

        const isRejected = msg.toLowerCase().includes('reject') || msg.toLowerCase().includes('cancel');
        const errType: InvestmentErrorType = isRejected ? 'user_rejected' : 'rpc_error';
        setError(errType, msg);
        toast.error(t('errorTitle'), { description: msg.slice(0, 120) });
      }
      return;
    }

    // ── Mock invest (legacy mock assets) ──────────────────────────────────

    let balanceCheck: { sufficient: boolean; balance: number };
    try {
      balanceCheck = await checkWalletBalance(walletAddress, amountUsdc);
    } catch {
      setError('rpc_error', 'checkWalletBalance failed');
      toast.error(t('errorTitle'), { description: errorMessage('rpc_error') });
      return;
    }

    if (!balanceCheck.sufficient) {
      setError('insufficient_balance', `Balance: $${balanceCheck.balance} USDC | Required: $${amountUsdc} USDC`);
      toast.error(t('errorTitle'), { description: errorMessage('insufficient_balance') });
      return;
    }

    let capCheck: { available: boolean; remainingCapacity: number };
    try {
      capCheck = await checkFundingCap(assetId, amountUsdc);
    } catch {
      setError('rpc_error', 'checkFundingCap failed');
      toast.error(t('errorTitle'), { description: errorMessage('rpc_error') });
      return;
    }

    if (!capCheck.available) {
      setError('funding_complete', `Remaining: $${capCheck.remainingCapacity}`);
      toast.error(t('errorTitle'), { description: errorMessage('funding_complete') });
      return;
    }

    transition('awaiting_signature');
    const toastId = toast.loading(t('stepAwaitingSignature'), {
      description: 'Phantom · Backpack · Solflare',
    });

    let result;
    try {
      result = await handleInvest({ assetId, walletAddress, amountUsdc });
      transition('confirming_on_chain');
      toast.loading(t('stepConfirming'), { id: toastId, description: '~400ms' });
    } catch (err: unknown) {
      const typed = err as { type?: InvestmentErrorType; message?: string };
      const errType: InvestmentErrorType = typed?.type ?? 'unknown';
      toast.dismiss(toastId);
      setError(errType, typed?.message);
      toast.error(t('errorTitle'), { description: errorMessage(errType) });
      return;
    }

    transition('success', { txSignature: result.txSignature });
    toast.dismiss(toastId);
    toast.success(t('successTitle'), {
      description: t('successMessage', { amount: amountUsdc, symbol: assetId.toUpperCase() }),
      action: {
        label: t('viewOnExplorer'),
        onClick: () => window.open(getExplorerTxUrl(result.txSignature), '_blank'),
      },
      duration: 8_000,
    });
  }, [
    state, assetId, walletAddress, blockchainParams,
    transition, setError, errorMessage, t,
    anchorInvest,
  ]);

  // ─── Reset ────────────────────────────────────────────────────────────────

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  // ─── Derived ──────────────────────────────────────────────────────────────

  const isProcessing = [
    'validation', 'wallet_check', 'awaiting_signature', 'confirming_on_chain',
  ].includes(state.step);

  const canSubmit = state.step === 'amount_entry' && state.amountUsdc >= minInvestment && !!walletAddress;

  return { state, walletAddress, onAmountChange, submit, reset, isProcessing, canSubmit };
}
