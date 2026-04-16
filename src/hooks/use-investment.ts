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
import type {
  InvestmentState,
  InvestmentStep,
  InvestmentError,
  InvestmentErrorType,
  InvestmentFees,
} from '@/types';

// ─── Estado inicial ───────────────────────────────────────────────────────────

const INITIAL_STATE: InvestmentState = {
  step: 'idle',
  amountUsdc: 0,
  fees: null,
  txSignature: null,
  error: null,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useInvestment(assetId: string, minInvestment: number) {
  const t = useTranslations('investment');
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toString() ?? null;

  const [state, setState] = useState<InvestmentState>(INITIAL_STATE);

  // Error messages come from i18n
  const errorMessage = useCallback(
    (type: InvestmentErrorType): string => t(`errors.${type}`),
    [t]
  );

  // Transition helper — garante imutabilidade
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

  // ─── Atualização de valor em tempo real ──────────────────────────────────

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

  // ─── Fluxo principal de investimento ─────────────────────────────────────

  const submit = useCallback(async () => {
    const { amountUsdc } = state;

    // ── STEP: validation ──────────────────────────────────────────────────
    transition('validation');

    const parsed = investmentSchema.safeParse({
      assetId,
      walletAddress: walletAddress ?? '',
      amountUsdc,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? t('errors.validation_failed');
      setError('validation_failed', firstIssue);
      toast.error(t('errorTitle'), { description: firstIssue });
      return;
    }

    // ── STEP: wallet_check ────────────────────────────────────────────────
    transition('wallet_check');

    if (!walletAddress) {
      setError('wallet_not_connected');
      toast.error(t('errorTitle'), { description: errorMessage('wallet_not_connected') });
      return;
    }

    // Verificar saldo USDC
    let balanceCheck: { sufficient: boolean; balance: number };
    try {
      balanceCheck = await checkWalletBalance(walletAddress, amountUsdc);
    } catch {
      setError('rpc_error', 'checkWalletBalance failed');
      toast.error(t('errorTitle'), { description: errorMessage('rpc_error') });
      return;
    }

    if (!balanceCheck.sufficient) {
      setError(
        'insufficient_balance',
        `Balance: $${balanceCheck.balance} USDC | Required: $${amountUsdc} USDC`
      );
      toast.error(t('errorTitle'), { description: errorMessage('insufficient_balance') });
      return;
    }

    // Verificar cap de captação
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

    // ── STEP: awaiting_signature ──────────────────────────────────────────
    transition('awaiting_signature');
    const toastId = toast.loading(t('stepAwaitingSignature'), {
      description: 'Phantom · Backpack · Solflare',
    });

    // ── STEP: confirming_on_chain ─────────────────────────────────────────
    let result;
    try {
      result = await handleInvest({ assetId, walletAddress, amountUsdc });
      transition('confirming_on_chain');
      toast.loading(t('stepConfirming'), {
        id: toastId,
        description: '~400ms',
      });
    } catch (err: unknown) {
      const typed = err as { type?: InvestmentErrorType; message?: string };
      const errType: InvestmentErrorType = typed?.type ?? 'unknown';
      toast.dismiss(toastId);
      setError(errType, typed?.message);
      toast.error(t('errorTitle'), { description: errorMessage(errType) });
      return;
    }

    // ── STEP: success ─────────────────────────────────────────────────────
    transition('success', { txSignature: result.txSignature });
    toast.dismiss(toastId);
    toast.success(t('successTitle'), {
      description: t('successMessage', {
        amount: amountUsdc,
        symbol: assetId.toUpperCase(),
      }),
      action: {
        label: t('viewOnExplorer'),
        onClick: () => window.open(getExplorerTxUrl(result.txSignature), '_blank'),
      },
      duration: 8_000,
    });
  }, [state, assetId, walletAddress, transition, setError, errorMessage, t]);

  // ─── Reset para reabertura do modal ──────────────────────────────────────

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  // ─── Derived state helpers ────────────────────────────────────────────────

  const isProcessing = [
    'validation',
    'wallet_check',
    'awaiting_signature',
    'confirming_on_chain',
  ].includes(state.step);

  const canSubmit =
    state.step === 'amount_entry' &&
    state.amountUsdc >= minInvestment;

  return {
    state,
    walletAddress,
    onAmountChange,
    submit,
    reset,
    isProcessing,
    canSubmit,
  };
}
