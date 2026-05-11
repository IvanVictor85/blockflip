'use client';

import { useState, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { useBlockFlip } from '@/hooks/useBlockFlip';
import { PROGRAM_ID } from '@/anchor/setup';
import { TestDriveSetup, type SetupResult } from '@/components/TestDriveSetup';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((m) => m.WalletMultiButton),
  { ssr: false }
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shortKey(key: string) {
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

function explorerUrl(sig: string) {
  return `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-md border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#14F195]"
      />
    </div>
  );
}

function ActionButton({
  onClick,
  loading,
  disabled,
  children,
}: {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="rounded-md bg-[#14F195] px-4 py-2 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
    >
      {loading ? 'Enviando…' : children}
    </button>
  );
}

// ─── Log line ─────────────────────────────────────────────────────────────────

interface LogEntry {
  ts: string;
  level: 'ok' | 'err' | 'info';
  msg: string;
  sig?: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TestDrivePage() {
  const { publicKey } = useWallet();
  const {
    protocolStatePda,
    fetchProtocolState,
    authorizeSpecialist,
    createPool,
    initializePoolVault,
    depositSkinInGame,
    invest,
    derivePoolPda,
    deriveSpecialistRegistryPda,
  } = useBlockFlip();

  // ── Auto-fill from TestDriveSetup ─────────────────────────────────────────
  const handleSetupComplete = useCallback((result: SetupResult) => {
    setCpMint(result.mint);
    setSigTokenAcc(result.walletTokenAccount);
    setSigPoolId(String(result.poolId));
    setInvTokenAcc(result.walletTokenAccount);
    setInvPoolId(String(result.poolId));
  }, []);

  // ── Log state ────────────────────────────────────────────────────────────
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const log = useCallback((level: LogEntry['level'], msg: string, sig?: string) => {
    setLogs((prev) => [
      { ts: new Date().toLocaleTimeString(), level, msg, sig },
      ...prev,
    ]);
  }, []);

  // ── Protocol state ────────────────────────────────────────────────────────
  const [proto, setProto] = useState<{
    authority: string;
    treasury: string;
    poolCount: number;
  } | null>(null);
  const [loadingProto, setLoadingProto] = useState(false);

  const handleFetchProto = useCallback(async () => {
    setLoadingProto(true);
    try {
      const state = await fetchProtocolState();
      setProto({
        authority: state.authority.toBase58(),
        treasury: state.platformTreasury.toBase58(),
        poolCount: state.poolCount.toNumber(),
      });
      log('ok', `ProtocolState carregada — pool_count: ${state.poolCount.toNumber()}`);
    } catch (e: unknown) {
      log('err', `fetchProtocolState: ${(e as Error).message}`);
    } finally {
      setLoadingProto(false);
    }
  }, [fetchProtocolState, log]);

  // ── Authorize Specialist ──────────────────────────────────────────────────
  const [authPubkey, setAuthPubkey] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);

  const handleAuthorize = useCallback(async () => {
    setLoadingAuth(true);
    try {
      const sig = await authorizeSpecialist(authPubkey.trim());
      log('ok', `Especialista autorizado: ${shortKey(authPubkey.trim())}`, sig);
    } catch (e: unknown) {
      log('err', `authorizeSpecialist: ${(e as Error).message}`);
    } finally {
      setLoadingAuth(false);
    }
  }, [authorizeSpecialist, authPubkey, log]);

  // ── Create Pool ───────────────────────────────────────────────────────────
  const [cpGoal, setCpGoal] = useState('');
  const [cpMax, setCpMax] = useState('');
  const [cpMint, setCpMint] = useState('');
  const [loadingCp, setLoadingCp] = useState(false);

  const handleCreatePool = useCallback(async () => {
    setLoadingCp(true);
    try {
      const result = await createPool(
        parseInt(cpGoal, 10),
        parseInt(cpMax, 10),
        cpMint.trim()
      );

      // SECURITY FIX: Initialize vault PDA
      await initializePoolVault(result.poolStatePda, cpMint.trim());

      log(
        'ok',
        `Pool #${result.poolId} criada & vault initialized — PDA: ${shortKey(result.poolStatePda.toBase58())}`,
        result.sig
      );
    } catch (e: unknown) {
      log('err', `createPool: ${(e as Error).message}`);
    } finally {
      setLoadingCp(false);
    }
  }, [createPool, initializePoolVault, cpGoal, cpMax, cpMint, log]);

  // ── Deposit Skin in Game ──────────────────────────────────────────────────
  const [sigPoolId, setSigPoolId] = useState('');
  const [sigTokenAcc, setSigTokenAcc] = useState('');
  const [loadingSig, setLoadingSig] = useState(false);

  const handleDepositSkin = useCallback(async () => {
    setLoadingSig(true);
    try {
      const sig = await depositSkinInGame(
        parseInt(sigPoolId, 10),
        sigTokenAcc.trim()
      );
      log('ok', `Skin-in-game depositado — pool #${sigPoolId}`, sig);
    } catch (e: unknown) {
      log('err', `depositSkinInGame: ${(e as Error).message}`);
    } finally {
      setLoadingSig(false);
    }
  }, [depositSkinInGame, sigPoolId, sigTokenAcc, log]);

  // ── Invest ────────────────────────────────────────────────────────────────
  const [invPoolId, setInvPoolId] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invTokenAcc, setInvTokenAcc] = useState('');
  const [loadingInv, setLoadingInv] = useState(false);

  const handleInvest = useCallback(async () => {
    setLoadingInv(true);
    try {
      const sig = await invest(
        parseInt(invPoolId, 10),
        parseInt(invAmount, 10),
        invTokenAcc.trim()
      );
      log('ok', `Aporte realizado — pool #${invPoolId}, amount: ${invAmount}`, sig);
    } catch (e: unknown) {
      log('err', `invest: ${(e as Error).message}`);
    } finally {
      setLoadingInv(false);
    }
  }, [invest, invPoolId, invAmount, invTokenAcc, log]);

  // ─────────────────────────────────────────────────────────────────────────

  const isConnected = !!publicKey;

  return (
    <main className="min-h-screen bg-background pt-20 pb-16">
      <div className="max-w-3xl mx-auto px-4 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              BlockFlip — Test Drive
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Controle on-chain direto no Devnet
            </p>
          </div>
          <WalletMultiButton
            style={{
              background: '#14F195',
              color: '#000',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 'bold',
              height: '36px',
              padding: '0 16px',
            }}
          />
        </div>

        {/* Infraestrutura SPL automática */}
        <TestDriveSetup onSetupComplete={handleSetupComplete} />

        {/* Wallet / Program Info */}
        <Card title="Sessão">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-mono">
            <div>
              <span className="text-muted-foreground text-xs">Carteira: </span>
              <span className={isConnected ? 'text-[#14F195]' : 'text-red-400'}>
                {isConnected ? shortKey(publicKey.toBase58()) : 'Não conectada'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Program ID: </span>
              <span>{shortKey(PROGRAM_ID.toBase58())}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Protocol PDA: </span>
              <span>{shortKey(protocolStatePda.toBase58())}</span>
            </div>
            {publicKey && (
              <div>
                <span className="text-muted-foreground text-xs">Seu Registry PDA: </span>
                <span>{shortKey(deriveSpecialistRegistryPda(publicKey).toBase58())}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Protocol State */}
        <Card title="1 · Protocol State">
          <ActionButton onClick={handleFetchProto} loading={loadingProto} disabled={!isConnected}>
            Buscar do Chain
          </ActionButton>
          {proto && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono border-t border-border pt-3">
              <div>
                <div className="text-muted-foreground mb-0.5">Authority</div>
                <div>{shortKey(proto.authority)}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-0.5">Treasury</div>
                <div>{shortKey(proto.treasury)}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-0.5">Pool Count</div>
                <div className="text-[#14F195] text-lg font-bold">{proto.poolCount}</div>
              </div>
            </div>
          )}
        </Card>

        {/* Authorize Specialist */}
        <Card title="2 · Authorize Specialist (authority only)">
          <Field
            label="Pubkey do Especialista"
            value={authPubkey}
            onChange={setAuthPubkey}
            placeholder="Ex: 8HJ9DeCCPsvadP45…"
          />
          {authPubkey.length > 30 && (
            <p className="text-xs text-muted-foreground font-mono">
              Registry PDA derivado:{' '}
              {(() => {
                try {
                  return shortKey(deriveSpecialistRegistryPda(new PublicKey(authPubkey.trim())).toBase58());
                } catch {
                  return '— pubkey inválida';
                }
              })()}
            </p>
          )}
          <ActionButton
            onClick={handleAuthorize}
            loading={loadingAuth}
            disabled={!isConnected || authPubkey.length < 32}
          >
            Autorizar Especialista →
          </ActionButton>
        </Card>

        {/* Create Pool */}
        <Card title="3 · Create Pool (especialista autorizado)">
          <Field
            label="Funding Goal (tokens base)"
            value={cpGoal}
            onChange={setCpGoal}
            placeholder="Ex: 1000"
            type="number"
          />
          <Field
            label="Max Investment por Investidor"
            value={cpMax}
            onChange={setCpMax}
            placeholder="Ex: 950"
            type="number"
          />
          <Field
            label="Accepted Mint (pubkey da stablecoin)"
            value={cpMint}
            onChange={setCpMint}
            placeholder="Devnet USDC mint…"
          />
          {cpGoal && cpMax && (
            <p className="text-xs text-muted-foreground">
              Pool PDA (pool_count atual): busque o Protocol State primeiro para calcular.
            </p>
          )}
          <ActionButton
            onClick={handleCreatePool}
            loading={loadingCp}
            disabled={!isConnected || !cpGoal || !cpMax || cpMint.length < 32}
          >
            Criar Pool →
          </ActionButton>
        </Card>

        {/* Deposit Skin in Game */}
        <Card title="4 · Deposit Skin-in-Game (5% do operador)">
          <Field
            label="Pool ID (número)"
            value={sigPoolId}
            onChange={setSigPoolId}
            placeholder="Ex: 0"
            type="number"
          />
          {sigPoolId !== '' && !isNaN(parseInt(sigPoolId, 10)) && (
            <p className="text-xs text-muted-foreground font-mono">
              Pool PDA: {shortKey(derivePoolPda(parseInt(sigPoolId, 10)).toBase58())}
            </p>
          )}
          <Field
            label="Operator Token Account"
            value={sigTokenAcc}
            onChange={setSigTokenAcc}
            placeholder="Pubkey da token account do operador"
          />
          <ActionButton
            onClick={handleDepositSkin}
            loading={loadingSig}
            disabled={!isConnected || sigPoolId === '' || !sigTokenAcc}
          >
            Depositar Skin-in-Game →
          </ActionButton>
        </Card>

        {/* Invest */}
        <Card title="5 · Invest (investidor)">
          <Field
            label="Pool ID (número)"
            value={invPoolId}
            onChange={setInvPoolId}
            placeholder="Ex: 0"
            type="number"
          />
          <Field
            label="Amount (tokens base)"
            value={invAmount}
            onChange={setInvAmount}
            placeholder="Ex: 950"
            type="number"
          />
          <Field
            label="Investor Token Account"
            value={invTokenAcc}
            onChange={setInvTokenAcc}
            placeholder="Pubkey da token account do investidor"
          />
          <ActionButton
            onClick={handleInvest}
            loading={loadingInv}
            disabled={!isConnected || !invPoolId || !invAmount || !invTokenAcc}
          >
            Investir →
          </ActionButton>
        </Card>

        {/* Log */}
        <Card title="Log de Transações">
          {logs.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma ação ainda.</p>
          ) : (
            <ul className="flex flex-col gap-2 font-mono text-xs max-h-64 overflow-y-auto">
              {logs.map((entry, i) => (
                <li key={i} className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{entry.ts}</span>
                    <span
                      className={
                        entry.level === 'ok'
                          ? 'text-[#14F195]'
                          : entry.level === 'err'
                          ? 'text-red-400'
                          : 'text-yellow-400'
                      }
                    >
                      [{entry.level.toUpperCase()}]
                    </span>
                    <span className="text-foreground">{entry.msg}</span>
                  </div>
                  {entry.sig && (
                    <a
                      href={explorerUrl(entry.sig)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-14 text-[#14F195] underline underline-offset-2 hover:opacity-80"
                    >
                      Ver no Explorer ↗
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

      </div>
    </main>
  );
}
