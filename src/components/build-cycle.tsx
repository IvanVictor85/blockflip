'use client';

import { Gavel, Search, FileText, HardHat, Sparkles, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const CYCLE_STAGES = [
  { icon: Gavel,      label: 'Arremate',   color: 'text-blue-700 dark:text-blue-400',    bg: 'bg-blue-100 border-blue-300 dark:bg-blue-400/10 dark:border-blue-400/30' },
  { icon: Search,     label: 'Vistoria',   color: 'text-violet-700 dark:text-violet-400',  bg: 'bg-violet-100 border-violet-300 dark:bg-violet-400/10 dark:border-violet-400/30' },
  { icon: FileText,   label: 'Projeto',    color: 'text-amber-700 dark:text-amber-400',   bg: 'bg-amber-100 border-amber-300 dark:bg-amber-400/10 dark:border-amber-400/30' },
  { icon: HardHat,    label: 'Reforma',    color: 'text-orange-700 dark:text-orange-400',  bg: 'bg-orange-100 border-orange-300 dark:bg-orange-400/10 dark:border-orange-400/30' },
  { icon: Sparkles,   label: 'Acabamento', color: 'text-pink-700 dark:text-pink-400',    bg: 'bg-pink-100 border-pink-300 dark:bg-pink-400/10 dark:border-pink-400/30' },
  { icon: TrendingUp, label: 'Venda',      color: 'text-emerald-700 dark:text-[#14F195]',   bg: 'bg-emerald-100 border-emerald-300 dark:bg-[#14F195]/10 dark:border-[#14F195]/30' },
];

export function BuildCycle() {
  return (
    <section id="proof-of-build" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/30 mb-4">
            Proof of Build
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ciclo Completo <span className="text-[#14F195]">On-Chain</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Cada etapa do property flipping é registrada e verificável na blockchain.
            Transparência total do arremate à venda.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-10 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500/30 via-[#14F195]/30 to-[#14F195]/60 mx-[8.33%]" />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {CYCLE_STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              return (
                <div key={stage.label} className="flex flex-col items-center gap-3 relative">
                  {/* Step number */}
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground font-bold">{idx + 1}</span>
                  </div>

                  {/* Icon circle */}
                  <div className={`w-20 h-20 rounded-2xl border ${stage.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-9 h-9 ${stage.color}`} />
                  </div>

                  {/* Label */}
                  <span className="text-sm font-semibold text-center">{stage.label}</span>

                  {/* Placeholder fields */}
                  <div className="w-full space-y-1.5">
                    <div className="h-6 rounded-md bg-secondary/60 border border-border/50 px-2 flex items-center">
                      <span className="text-[10px] text-muted-foreground/50">Data prevista</span>
                    </div>
                    <div className="h-6 rounded-md bg-secondary/60 border border-border/50 px-2 flex items-center">
                      <span className="text-[10px] text-muted-foreground/50">Foto / Desc.</span>
                    </div>
                  </div>

                  {/* Status pill */}
                  <div className={`text-[10px] px-2 py-0.5 rounded-full border ${idx === 0 ? `${stage.bg} ${stage.color} font-semibold` : 'bg-secondary/40 border-border/40 text-muted-foreground/50'}`}>
                    {idx === 0 ? 'Em andamento' : idx < 2 ? 'Pendente' : 'Aguardando'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* On-chain note */}
        <p className="text-center text-xs text-muted-foreground/50 mt-10">
          Todas as etapas são registradas via smart contracts na Solana — imutável e auditável por qualquer investidor.
        </p>
      </div>
    </section>
  );
}
