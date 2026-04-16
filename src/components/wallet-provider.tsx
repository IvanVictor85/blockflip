'use client';

import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
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

  // Explicit adapters bypass Wallet Standard auto-detection conflicts.
  // PhantomWalletAdapter + SolflareWalletAdapter create a direct bridge
  // that the modal uses even when multiple extensions fight for window.solana.
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  // All three providers are SSR-safe:
  // - ConnectionProvider / WalletProvider: initialise React context with defaults,
  //   never access browser APIs during the render phase.
  // - WalletModalProvider: provides context + renders a portal, but the portal only
  //   inserts DOM when visible=true, so SSR output is identical to client output.
  // Keeping WalletModalProvider unconditional ensures useWalletModal() always gets
  // the real setVisible — a conditional provider would give consumers a no-op during
  // SSR/hydration, silently breaking the connect button click handler.
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
