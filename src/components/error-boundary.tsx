"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  context?: string; // ex: "AssetCard", "Marketplace" — para logs
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary reutilizável para isolar falhas em componentes.
 * Garante que um crash em um card não derruba o marketplace inteiro.
 *
 * Uso:
 *   <ErrorBoundary context="AssetCard">
 *     <AssetCard asset={asset} />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Log estruturado — sem expor ao usuário
    console.error(`[BlockFlip][ErrorBoundary:${this.props.context ?? "unknown"}]`, {
      message: error.message,
      componentStack: info.componentStack.slice(0, 300),
      timestamp: new Date().toISOString(),
    });
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-red-500/20 bg-red-500/5 text-center">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Componente indisponível
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Erro isolado — restante da aplicação está funcionando.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={this.reset}
            className="border-red-500/30 hover:border-red-500/50 text-red-400 text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1.5" />
            Tentar novamente
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
