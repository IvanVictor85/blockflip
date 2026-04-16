'use client';

import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { clusterApiUrl } from '@solana/web3.js';

interface SolanaWalletProviderProps {
  children: React.ReactNode;
}

/**
 * SolanaWalletProvider
 *
 * Wraps ConnectionProvider + WalletProvider from @solana/wallet-adapter-react.
 * Both providers are SSR-safe: they initialise React context with default values
 * and only access browser APIs (wallet detection, window.solana) inside useEffect
 * hooks — never during the render phase — so there is no hydration mismatch.
 *
 * Wallet Standard v1 auto-registers installed wallets (Phantom, Backpack,
 * Solflare, …) without explicit adapter entries; wallets={[]} is intentional.
 */
export function SolanaWalletProvider({ children }: SolanaWalletProviderProps) {
  const endpoint = useMemo(
    () =>
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
      clusterApiUrl(
        process.env.NODE_ENV === 'production' ? 'mainnet-beta' : 'devnet'
      ),
    []
  );

  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
