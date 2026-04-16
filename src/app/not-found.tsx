import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* 404 visual */}
        <div className="space-y-2">
          <div className="text-8xl font-black text-[#14F195]/20 select-none">
            404
          </div>
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-[#14F195]/10 border border-[#14F195]/20">
              <Search className="w-8 h-8 text-[#14F195]" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Página não encontrada</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            O ativo ou página que você procura não existe ou foi movido.
            Explore as oportunidades disponíveis no marketplace.
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <Link
            href="/#marketplace"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#14F195] text-black text-sm font-semibold hover:bg-[#0ED47F] transition-colors"
          >
            Ver Marketplace
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-border text-sm font-medium hover:border-[#14F195]/30 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Início
          </Link>
        </div>
      </div>
    </div>
  );
}
