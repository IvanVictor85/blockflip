'use client';

import { useEffect, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
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

  // Only Phantom — reduces MessageEvent noise from Backpack/MetaMask fighting
  // over window.solana during the Wallet Standard handshake.
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  // useEffect fires only on the client after hydration — guaranteed to appear
  // in the browser DevTools console (unlike a render-phase log which runs on
  // the server and is invisible to the browser).
  useEffect(() => {
    console.log('[BlockFlip][SolanaWalletProvider] client mounted, endpoint:', endpoint);
  }, [endpoint]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider
        wallets={wallets}
        autoConnect={false}
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
