'use client';

import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';

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
  const endpoint = useMemo(() => {
    const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    // Guard against empty string — ?? only catches null/undefined
    if (rpc && rpc.startsWith('http')) return rpc;
    return clusterApiUrl('devnet');
  }, []);

  // Empty list — Wallet Standard v1 auto-registers Phantom, Backpack, Solflare
  // without explicit adapters. Manual adapters were conflicting with the Standard.
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider
        wallets={wallets}
        autoConnect={true}
        onError={(error) => {
          console.error('[BlockFlip][WalletProvider] error:', error.name, error.message);
        }}
      >
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
