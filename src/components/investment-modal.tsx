'use client';

import { useEffect, useRef } from 'react';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Wallet,
  TrendingUp,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useInvestment, type BlockchainInvestParams } from '@/hooks/use-investment';
import { getExplorerTxUrl } from '@/lib/solana';
import { formatCurrency } from '@/data/mock-assets';
import type { Asset } from '@/types';

// ─── Ícone de progresso do step atual ────────────────────────────────────────
function StepIcon({ step }: { step: string }) {
  if (['validation', 'wallet_check', 'awaiting_signature', 'confirming_on_chain'].includes(step)) {
    return <Loader2 className="w-4 h-4 animate-spin" />;
  }
  if (step === 'success') return <CheckCircle2 className="w-4 h-4 text-[#14F195]" />;
  if (step === 'error')   return <AlertCircle className="w-4 h-4 text-red-400" />;
  return null;
}

// ─── Resumo de Taxas ─────────────────────────────────────────────────────────
function FeeSummary({ capital, protocolFee, total, tokensReceived, tokenSymbol }: {
  capital: number;
  protocolFee: number;
  total: number;
  tokensReceived: number;
  tokenSymbol: string;
}) {
  const t = useTranslations('investment');
  return (
    <div className="rounded-xl bg-secondary/50 border border-border p-4 space-y-2.5 text-sm">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        {t('feeSummaryTitle')}
      </p>
      <div className="flex justify-between">
        <span className="text-muted-foreground">{t('feeCapital')}</span>
        <span className="font-medium">{formatCurrency(capital)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">{t('feeProtocol')}</span>
        <span className="font-medium text-amber-400">{formatCurrency(protocolFee)}</span>
      </div>
      <div className="h-px bg-border" />
      <div className="flex justify-between font-semibold">
        <span>{t('feeTotal')}</span>
        <span className="text-[#14F195]">{formatCurrency(total)}</span>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground pt-1">
        <span>{t('feeTokens')}</span>
        <span className="font-mono">{tokensReceived.toLocaleString()} {tokenSymbol}</span>
      </div>
    </div>
  );
}

// ─── Tela de Sucesso ─────────────────────────────────────────────────────────
function SuccessScreen({ txSignature, amountUsdc, tokenSymbol, onClose }: {
  txSignature: string;
  amountUsdc: number;
  tokenSymbol: string;
  onClose: () => void;
}) {
  const t = useTranslations('investment');
  return (
    <div className="flex flex-col items-center text-center space-y-5 py-4">
      <div className="p-4 rounded-full bg-[#14F195]/10 border border-[#14F195]/30">
        <CheckCircle2 className="w-12 h-12 text-[#14F195]" />
      </div>
      <div>
        <h3 className="text-xl font-bold mb-1">{t('successTitle')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('successMessage', { amount: amountUsdc, symbol: tokenSymbol })}
        </p>
      </div>
      <div className="w-full rounded-xl bg-[#14F195]/5 border border-[#14F195]/20 p-3">
        <p className="text-xs text-muted-foreground mb-1">{t('successTxLabel')}</p>
        <p className="text-xs font-mono text-[#14F195] break-all">{txSignature.slice(0, 48)}...</p>
      </div>
      <div className="flex gap-3 w-full">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 border-[#14F195]/30 hover:border-[#14F195]/50 text-xs"
          onClick={() => window.open(getExplorerTxUrl(txSignature), '_blank')}
        >
          <ExternalLink className="w-3 h-3 mr-1.5" />
          {t('viewOnExplorer')}
        </Button>
        <Button
          size="sm"
          className="flex-1 bg-[#14F195] text-black hover:bg-[#0ED47F] text-xs"
          onClick={onClose}
        >
          {t('close')}
        </Button>
      </div>
    </div>
  );
}

// ─── Tela de Erro ────────────────────────────────────────────────────────────
function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  const t = useTranslations('investment');
  return (
    <div className="flex flex-col items-center text-center space-y-4 py-4">
      <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20">
        <AlertCircle className="w-10 h-10 text-red-400" />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-1">{t('errorTitle')}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
      </div>
      <Button
        onClick={onRetry}
        className="w-full bg-secondary hover:bg-[#14F195]/10 border border-transparent hover:border-[#14F195]/30"
      >
        {t('retry')}
      </Button>
    </div>
  );
}

// ─── Modal principal ──────────────────────────────────────────────────────────

interface InvestmentModalProps {
  asset: Asset;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ASSET_NAME_KEY: Record<string, string> = {
  'asset-001': 'asset001',
  'asset-002': 'asset002',
  'asset-003': 'asset003',
  'asset-004': 'asset004',
};

export function InvestmentModal({ asset, open, onOpenChange }: InvestmentModalProps) {
  const t = useTranslations('investment');
  const tNames = useTranslations('assetNames');
  const inputRef = useRef<HTMLInputElement>(null);
  const nameKey = ASSET_NAME_KEY[asset.id];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const displayTitle = nameKey ? (tNames as any)(nameKey) as string : asset.title;

  // Wire real Anchor invest for on-chain pools; fall back to mock for demo assets
  const blockchainParams: BlockchainInvestParams | undefined =
    asset.poolId !== undefined && asset.poolVault && asset.investorAta
      ? { poolId: asset.poolId, poolVault: asset.poolVault, investorTokenAccount: asset.investorAta }
      : undefined;

  const { state, walletAddress, onAmountChange, submit, reset, isProcessing, canSubmit } =
    useInvestment(asset.id, asset.minInvestment, blockchainParams);

  const isConnected = Boolean(walletAddress);
  const fundingRemaining = asset.fundingGoal - asset.fundingRaised;
  const fundingPct = ((asset.fundingRaised / asset.fundingGoal) * 100).toFixed(0);

  // Step label map
  const stepLabel: Record<string, string> = {
    idle:                t('invest') ?? 'Invest',
    amount_entry:        t('invest') ?? 'Invest',
    validation:          t('stepValidating'),
    wallet_check:        t('stepWalletCheck'),
    awaiting_signature:  t('stepAwaitingSignature'),
    confirming_on_chain: t('stepConfirming'),
    success:             t('successTitle'),
    error:               t('retry'),
  };

  // Foco no input ao abrir
  useEffect(() => {
    if (open && state.step === 'idle') {
      onAmountChange('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, state.step, onAmountChange]);

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">

        {/* ── Header ── */}
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge className="bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/30 text-xs">
              <ShieldCheck className="w-3 h-3 mr-1" />
              {t('speVerified')}
            </Badge>
            <Badge className="bg-secondary border-border text-xs">{asset.tokenSymbol}</Badge>
            {blockchainParams && (
              <Badge className="bg-blue-500/10 text-blue-500 border border-blue-500/20 text-xs">
                On-chain · Pool #{asset.poolId}
              </Badge>
            )}
          </div>
          <DialogTitle className="text-xl">{displayTitle}</DialogTitle>
          <DialogDescription className="text-xs">{asset.location}</DialogDescription>
        </DialogHeader>

        {/* ── Conteúdo dinâmico por estado ── */}
        {state.step === 'success' && state.txSignature ? (
          <SuccessScreen
            txSignature={state.txSignature}
            amountUsdc={state.amountUsdc}
            tokenSymbol={asset.tokenSymbol}
            onClose={() => handleOpenChange(false)}
          />
        ) : state.step === 'error' && state.error ? (
          <ErrorScreen message={state.error.message} onRetry={reset} />
        ) : (
          <div className="space-y-5">

            {/* Snapshot do ativo */}
            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-0.5">{t('roi')}</p>
                <p className="font-bold text-[#14F195]">{asset.estimatedROI}%</p>
              </div>
              <div className="text-center border-x border-border">
                <p className="text-xs text-muted-foreground mb-0.5">{t('cycle')}</p>
                <p className="font-bold">{asset.cycleDays}d</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-0.5">{t('funded')}</p>
                <p className="font-bold">{fundingPct}%</p>
              </div>
            </div>

            {/* Input de valor */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="invest-amount">
                {t('amountLabel')}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                  $
                </span>
                <Input
                  id="invest-amount"
                  ref={inputRef}
                  type="number"
                  step="50"
                  min={asset.minInvestment}
                  max={fundingRemaining}
                  placeholder={`${asset.minInvestment}`}
                  className="pl-7"
                  disabled={isProcessing}
                  onChange={(e) => onAmountChange(e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  USDC
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t('minimum')}: ${asset.minInvestment}</span>
                <span>{t('available')}: {formatCurrency(fundingRemaining)}</span>
              </div>

              {/* Atalhos de valor */}
              <div className="flex gap-2 flex-wrap">
                {[100, 500, 1000, 5000]
                  .filter((v) => v >= asset.minInvestment && v <= fundingRemaining)
                  .map((v) => (
                    <button
                      key={v}
                      onClick={() => {
                        if (inputRef.current) inputRef.current.value = String(v);
                        onAmountChange(String(v));
                      }}
                      className="px-2.5 py-1 rounded-md text-xs border border-border hover:border-[#14F195]/40 hover:bg-[#14F195]/5 transition-colors disabled:opacity-50"
                      disabled={isProcessing}
                    >
                      ${v.toLocaleString()}
                    </button>
                  ))}
              </div>
            </div>

            {/* Resumo de taxas */}
            {state.fees && (
              <FeeSummary
                capital={state.fees.capital}
                protocolFee={state.fees.protocolFee}
                total={state.fees.total}
                tokensReceived={state.fees.tokensReceived}
                tokenSymbol={asset.tokenSymbol}
              />
            )}

            {/* Status de progresso */}
            {isProcessing && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[#14F195]/5 border border-[#14F195]/20">
                <Loader2 className="w-4 h-4 text-[#14F195] animate-spin shrink-0" />
                <p className="text-sm text-[#14F195]">{stepLabel[state.step]}</p>
              </div>
            )}

            {/* Wallet status */}
            {!isProcessing && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Wallet className="w-3.5 h-3.5" />
                {isConnected && walletAddress ? (
                  <span>
                    {t('walletConnected')}:{' '}
                    <span className="font-mono">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </span>
                  </span>
                ) : (
                  <span className="text-amber-400">{t('walletNotConnected')}</span>
                )}
              </div>
            )}

            {/* CTA */}
            <Button
              className="w-full bg-[#14F195] text-black hover:bg-[#0ED47F] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!canSubmit || isProcessing}
              onClick={() => submit()}
            >
              {isProcessing ? (
                <>
                  <StepIcon step={state.step} />
                  <span className="ml-2">{stepLabel[state.step]}</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {canSubmit
                    ? t('ctaInvest', { amount: state.amountUsdc > 0 ? formatCurrency(state.amountUsdc) : '' })
                    : t('ctaMinimum', { amount: asset.minInvestment })}
                  {canSubmit && <ArrowRight className="w-4 h-4 ml-2" />}
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              {t('disclaimer')}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
