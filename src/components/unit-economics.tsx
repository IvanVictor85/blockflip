'use client';

import { Plus, Equal, TrendingUp, Users, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { mockUnitEconomics, formatCurrency } from '@/data/mock-assets';

export function UnitEconomics() {
  const data = mockUnitEconomics;

  return (
    <section id="how-it-works" className="py-20 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge className="bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/30 mb-4">
            Unit Economics
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Como o Lucro é Gerado
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Modelo simples e transparente: compramos barato, reformamos rápido, vendemos com ágio.
          </p>
        </div>

        {/* Visual Formula */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-6 mb-16">
          {/* Step 1: Buy Low */}
          <div className="flex-1 max-w-xs w-full">
            <div className="p-6 rounded-2xl bg-card border border-border text-center">
              <div className="w-14 h-14 rounded-full bg-amber-400/10 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Compra Baixa</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Imóveis de leilão ou em estado precário
              </p>
              <div className="p-3 rounded-lg bg-secondary">
                <span className="text-2xl font-bold">{formatCurrency(data.acquisitionCost)}</span>
              </div>
            </div>
          </div>

          {/* Plus Sign */}
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#14F195]/10 text-[#14F195]">
            <Plus className="w-6 h-6" />
          </div>

          {/* Step 2: Reform */}
          <div className="flex-1 max-w-xs w-full">
            <div className="p-6 rounded-2xl bg-card border border-border text-center">
              <div className="w-14 h-14 rounded-full bg-[#14F195]/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-[#14F195]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">Reforma Ágil</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Execução rápida com Proof of Build
              </p>
              <div className="p-3 rounded-lg bg-secondary">
                <span className="text-2xl font-bold">{formatCurrency(data.reformCost + data.operationalCost)}</span>
              </div>
            </div>
          </div>

          {/* Equals Sign */}
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#14F195]/10 text-[#14F195]">
            <Equal className="w-6 h-6" />
          </div>

          {/* Step 3: Sell Premium */}
          <div className="flex-1 max-w-xs w-full">
            <div className="p-6 rounded-2xl bg-card border border-[#14F195]/30 text-center glow-solana">
              <div className="w-14 h-14 rounded-full bg-[#14F195]/10 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-7 h-7 text-[#14F195]" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Saída Premium</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Venda no valor de mercado reformado
              </p>
              <div className="p-3 rounded-lg bg-[#14F195]/10">
                <span className="text-2xl font-bold text-[#14F195]">{formatCurrency(data.targetSalePrice)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profit Breakdown */}
        <div className="max-w-2xl mx-auto">
          <div className="p-6 rounded-2xl bg-card border border-border">
            <h4 className="font-semibold text-lg mb-6 text-center">Distribuição do Lucro</h4>

            <div className="space-y-4">
              {/* Gross Profit */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <span className="text-muted-foreground">Lucro Bruto</span>
                <span className="font-semibold">{formatCurrency(data.grossProfit)}</span>
              </div>

              {/* Net Profit */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <span className="text-muted-foreground">Lucro Líquido (após custos)</span>
                <span className="font-semibold">{formatCurrency(data.netProfit)}</span>
              </div>

              {/* Distribution */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="p-4 rounded-xl bg-[#14F195]/5 border border-[#14F195]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-[#14F195]" />
                    <span className="text-sm text-muted-foreground">Investidores (90%)</span>
                  </div>
                  <span className="text-xl font-bold text-[#14F195]">{formatCurrency(data.investorShare)}</span>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Protocolo (10%)</span>
                  </div>
                  <span className="text-xl font-bold">{formatCurrency(data.protocolFee)}</span>
                </div>
              </div>

              {/* ROI Highlight */}
              <div className="flex items-center justify-center p-4 rounded-xl bg-[#14F195]/10 border border-[#14F195]/30 mt-4">
                <TrendingUp className="w-5 h-5 text-[#14F195] mr-2" />
                <span className="font-semibold">
                  ROI para Investidor: <span className="text-[#14F195]">~{((data.investorShare / data.totalCost) * 100).toFixed(1)}%</span> em &lt;6 meses
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
