# Feature: Fluxo de Investimento (Aporte USDC + Emissão RWA)

## User Story

> **Como** investidor Web2 sem experiência em crypto,
> **Quero** aportar USDC em um imóvel tokenizado de forma simples e segura,
> **Para** receber frações RWA do ativo e participar do lucro na venda.

**Critérios de Aceite:**
- [ ] Posso clicar em "Investir" em qualquer card com captação aberta
- [ ] Vejo um resumo claro de taxas antes de confirmar
- [ ] Recebo feedback visual em cada etapa da transação
- [ ] Em caso de erro, vejo uma mensagem clara e posso tentar novamente
- [ ] Posso verificar a transação no Solana Explorer após o sucesso

---

## Fluxograma de Estados

```
                        ┌─────────────┐
                        │    IDLE     │  ← Modal fechado
                        └──────┬──────┘
                               │ [Clica "Investir"]
                        ┌──────▼──────┐
                        │AMOUNT_ENTRY │  ← Digitando valor + cálculo de fees
                        └──────┬──────┘
                               │ [Clica "Aportar"]
                        ┌──────▼──────┐
                        │ VALIDATION  │  ← Zod valida assetId + wallet + amount
                        └──────┬──────┘
                           ✓   │   ✗ ──────────────────────────┐
                        ┌──────▼──────┐                        │
                        │WALLET_CHECK │  ← Verifica conexão    │
                        │             │    + saldo USDC         │
                        │             │    + funding cap        │
                        └──────┬──────┘                        │
                           ✓   │   ✗ ──────────────────────────┤
                        ┌──────▼───────────┐                   │
                        │AWAITING_SIGNATURE│  ← Phantom/Backpack│
                        └──────┬───────────┘                   │
                           ✓   │   ✗ ──────────────────────────┤
                        ┌──────▼──────────────┐                │
                        │CONFIRMING_ON_CHAIN  │  ← TX na rede  │
                        └──────┬──────────────┘                │
                           ✓   │   ✗ ──────────────────────────┤
                        ┌──────▼──────┐                 ┌──────▼──────┐
                        │   SUCCESS   │                 │    ERROR    │
                        │  Toast ✓    │                 │  Toast ✗    │
                        │  Explorer   │                 │  [Retry]    │
                        └─────────────┘                 └─────────────┘
```

---

## Máquina de Estados — Definição Completa

| Estado | Trigger | UI | Bloqueante? |
|---|---|---|---|
| `idle` | Modal fechado | — | Não |
| `amount_entry` | Modal aberto / valor alterado | Input + fee summary | Não |
| `validation` | Submit clicado | Loader | Sim |
| `wallet_check` | Validação OK | Loader | Sim |
| `awaiting_signature` | Wallet verificada | Loader + toast | Sim |
| `confirming_on_chain` | TX submetida | Loader + toast | Sim |
| `success` | TX confirmada | Tela de sucesso + tx hash | Não |
| `error` | Qualquer falha | Mensagem descritiva + retry | Não |

---

## Casos de Erro Mapeados

| Tipo (`InvestmentErrorType`) | Causa | Mensagem ao Usuário | Ação |
|---|---|---|---|
| `insufficient_balance` | Saldo USDC < valor | "Saldo USDC insuficiente. Adicione fundos à sua wallet." | Fechar modal |
| `wallet_not_connected` | Nenhuma wallet detectada | "Nenhuma wallet conectada. Clique em Conectar Wallet." | Fechar + conectar |
| `user_rejected` | Usuário cancelou na wallet | "Transação rejeitada. Você cancelou a assinatura na wallet." | Retry |
| `rpc_error` | Falha de rede Solana | "Erro de comunicação com a rede Solana. Verifique sua conexão." | Retry |
| `funding_complete` | Cap de captação atingido | "Este ativo já atingiu o cap de captação." | Fechar |
| `below_minimum` | Valor < mínimo do ativo | "Valor abaixo do mínimo permitido para este ativo." | Corrigir valor |
| `validation_failed` | Zod schema reject | Mensagem do schema | Corrigir input |
| `unknown` | Erro não categorizado | "Ocorreu um erro inesperado. Por favor, tente novamente." | Retry |

---

## Resumo de Taxas

```
Capital do investidor:  $X.XX USDC
Fee do protocolo (1%):  $X.XX USDC  ← PROTOCOL_FEE_BPS = 100
─────────────────────────────────────
Total debitado:         $X.XX USDC
Tokens RWA recebidos:   X.XX {SYMBOL}
```

**Regra de negócio:** 1 token = 1 USDC investido (simplificado na v1).
Fee é aplicada sobre o capital bruto, não sobre o retorno.

---

## Componentes Criados

| Arquivo | Responsabilidade |
|---|---|
| `src/hooks/use-investment.ts` | Máquina de estados, orquestração do fluxo |
| `src/components/investment-modal.tsx` | UI do modal com todos os estados |
| `src/components/ui/dialog.tsx` | Primitivo Dialog (Radix) |
| `src/components/ui/input.tsx` | Input numérico com estilo BlockFlip |
| `src/lib/solana/index.ts` | Mock das funções de contrato Solana |
| `src/types/index.ts` | Tipos: InvestmentState, InvestmentError, InvestmentFees |

---

## Preparação para o Contrato Solana (Checklist v2)

Funções mock em `src/lib/solana/index.ts` a serem substituídas por chamadas Anchor:

- [ ] `handleInvest()` → `program.methods.invest(amount).accounts({...}).rpc()`
- [ ] `checkWalletBalance()` → `connection.getTokenAccountBalance(ata)`
- [ ] `checkFundingCap()` → `program.account.assetPool.fetch(pda)`
- [ ] `handleCancelPosition()` → `program.methods.cancelPosition().accounts({...}).rpc()`

**Constantes a definir no deploy:**
- `PROGRAM_ID` — endereço do programa Anchor deployado
- `USDC_MINT` — `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` (mainnet)
- `TOKEN_2022_PROGRAM_ID` — `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`

---

## Definition of Done (DoD)

### Funcional
- [x] Modal abre ao clicar "Investir" em card com captação aberta
- [x] Atalhos de valor ($100, $500, $1.000, $5.000) funcionam
- [x] Fee summary atualiza em tempo real com cada mudança de valor
- [x] Todos os 8 estados exibem UI correta
- [x] Toast de progresso aparece durante transação
- [x] Toast de sucesso tem link "Ver no Explorer"
- [x] Tela de erro mostra mensagem descritiva + botão retry
- [x] Captação encerrada desabilita botão "Investir"

### Qualidade
- [x] `npm run type-check` — zero erros
- [x] `npm run lint` — zero warnings
- [x] `npm run build` — build limpo

### Segurança
- [x] Zod valida todos os inputs antes de qualquer ação on-chain
- [x] Erros técnicos logados mas nunca expostos ao usuário
- [x] Wallet address truncada em logs
- [x] Nenhuma chave privada manipulada no frontend

### Pendente (v2 — contrato real)
- [ ] Integração com `@solana/wallet-adapter-react` (substituir mock wallet)
- [ ] Substituir mocks de `src/lib/solana/` por chamadas Anchor reais
- [ ] Teste de transação em devnet
- [ ] Auditoria do smart contract Rust
