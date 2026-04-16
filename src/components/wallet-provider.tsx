'use client';

import { useMemo, useSyncExternalStore } from 'react';
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
// useSyncExternalStore is the React-idiomatic way to detect server vs client
// without violating the react-hooks/set-state-in-effect ESLint rule.
// getServerSnapshot returns false (SSR), getSnapshot returns true (browser).
function subscribe() { return () => {}; }
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function SolanaWalletProvider({ children }: SolanaWalletProviderProps) {
  const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  const endpoint = useMemo(() => {
    const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    // Guard against empty string — ?? only catches null/undefined
    if (rpc && rpc.startsWith('http')) return rpc;
    return clusterApiUrl('devnet');
  }, []);

  const wallets = useMemo(() => [], []);

  if (!mounted) return <>{children}</>;

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
