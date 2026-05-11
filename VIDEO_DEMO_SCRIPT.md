# BlockFlip — Video Demo Script (3 minutos)
**Solana Colosseum 2026 - Technical Demonstration**

---

## Pre-Production Checklist

### Setup Requirements
- [ ] Devnet wallet com ~2 SOL (faucet: https://faucet.solana.com)
- [ ] Devnet USDC mint (ou usar mock mint no programa)
- [ ] Frontend rodando em localhost:3000 ou Vercel deploy URL
- [ ] Solscan devnet aberto em aba separada
- [ ] OBS/Screen recorder configurado (1080p, 30fps)
- [ ] Audio test realizado
- [ ] Browser em tela cheia, zoom 100%

### Test Run Before Recording
1. Execute o fluxo completo uma vez para validar timings
2. Limpe transações anteriores (use wallet nova se necessário)
3. Tenha os links de Solscan salvos para transições rápidas

---

## Script Estruturado (180 segundos)

### **[0:00 - 0:20] ABERTURA + CONTEXTO (20s)**

**Visual**: Slide de abertura ou homepage do BlockFlip

**Narração**:
> "BlockFlip is a real-world asset protocol on Solana that tokenizes property flips in Brazil. Our core innovation is **skin-in-the-game enforcement**: before accepting investor capital, operators must deposit 5% of the funding goal into a PDA vault. This creates cryptographic proof of alignment — if the flip fails, the operator loses first.
>
> Today I'll demonstrate the complete lifecycle: operator creates a pool, deposits skin-in-the-game, investor participates, and we track everything on-chain with full transparency."

**Timing**: ~18-20 segundos (120-130 palavras/minuto)

---

### **[0:20 - 0:50] OPERATOR FLOW — Pool Creation + Skin Deposit (30s)**

**Visual**: Tela de criação de pool (Specialist Dashboard)

**Narração**:
> "First, the operator creates a pool. Let's set a funding goal of 100,000 USDC for a foreclosed property in São Paulo."

**Actions**:
1. Conecta carteira Phantom/Solflare (se não conectado)
2. Preenche formulário:
   - **Funding Goal**: 100,000 USDC
   - **Max Investment per Investor**: 10,000 USDC (compliance)
   - **Property Address**: "Rua Exemplo, 123 - São Paulo/SP"
3. Clica em **Create Pool**
4. Aprova transação na wallet

**Narração (durante preenchimento)**:
> "Notice the pool starts in **Pending** status — investors can't deposit yet. Now the critical step: the operator must deposit 5% of the goal — that's 5,000 USDC — into the vault PDA."

**Actions**:
5. Aguarda confirmação da tx (devnet é rápido, ~2s)
6. Clica em **Deposit Skin-in-Game** (botão aparece após pool criado)
7. Confirma transação de 5,000 USDC na wallet

**Narração (durante depósito)**:
> "This 5,000 USDC is now locked in a PDA controlled by the program. The pool status changes to **Funding** — only now can investors participate. Let me show you the on-chain proof."

**Visual**: Switch rápido para **Solscan** (aba já aberta)

**Actions**:
8. Mostra a transação do `deposit_skin_in_game` no Solscan
9. Destaca o **pool_vault** PDA com saldo de 5,000 USDC

**Narração**:
> "Here's the Solscan transaction: 5,000 USDC transferred to the vault PDA. This is verifiable by anyone — no trust required."

**Timing**: ~30 segundos

---

### **[0:50 - 1:20] INVESTOR FLOW — Investment + On-Chain Verification (30s)**

**Visual**: Switch de volta para frontend (página de pools disponíveis ou investor dashboard)

**Narração**:
> "Now let's switch to the investor perspective. I'll connect a different wallet and invest 10,000 USDC into this pool."

**Actions**:
1. Desconecta wallet do operador
2. Conecta wallet do investidor (segunda wallet preparada previamente)
3. Navega para pool criado (lista de pools ou direct link)
4. Mostra detalhes do pool:
   - **Funding Goal**: 100,000 USDC
   - **Already Raised**: 5,000 USDC (skin-in-game do operador)
   - **Operator Vault**: Badge verde "Verified" ou link para Solscan
5. Clica em **Invest**
6. Insere **10,000 USDC**
7. Aprova transação

**Narração (durante transação)**:
> "My investment is processed instantly. The pool now has 15,000 USDC total: 5,000 from the operator's skin-in-game, plus my 10,000. Notice the funding bar updates in real-time."

**Visual**: Switch rápido para Solscan (transação do `invest`)

**Actions**:
8. Mostra transação no Solscan
9. Destaca que o **pool_vault** agora tem 15,000 USDC (5k + 10k)

**Narração**:
> "On-chain verification again: my 10,000 USDC is now in the vault, alongside the operator's 5,000. Full transparency."

**Timing**: ~30 segundos

---

### **[1:20 - 1:50] MILESTONE TRACKING + POOL COMPLETION (30s)**

**Visual**: Volta ao frontend (operator wallet reconectado)

**Narração**:
> "As the operator, I now submit milestones to prove renovation progress. Each milestone requires an **evidence hash** — typically an IPFS CID linking to invoices or photos."

**Actions**:
1. Conecta wallet do operador novamente
2. Navega para página de gerenciamento do pool (Pool Details ou Operator Dashboard)
3. Clica em **Submit Milestone**
4. Preenche:
   - **Milestone Index**: 0 (primeira milestone)
   - **Evidence Hash**: [mock hash ou IPFS CID real se tiver]
5. Aprova transação

**Narração (durante milestone)**:
> "Milestone submitted. Investors can now verify the renovation is happening. Fast-forward: the property sells for 120,000 USDC — a 20% profit."

**Actions**:
6. Clica em **Complete Pool**
7. Insere **Total Proceeds**: 120,000 USDC
8. Aprova transação

**Narração**:
> "The pool status changes to **Completed**. Now we distribute profits."

**Timing**: ~30 segundos

---

### **[1:50 - 2:30] PROFIT DISTRIBUTION — Investor + Operator (40s)**

**Visual**: Frontend (investor wallet conectada)

**Narração**:
> "Let's see the investor's payout. The upside is 20,000 USDC. Investors get 60% of the upside, pro-rata. I invested 10,000 out of 100,000 total — that's 10%. My share of the 60% upside pool is..."

**Actions**:
1. Conecta wallet do investidor
2. Navega para **My Investments** ou pool details
3. Clica em **Claim Proceeds**
4. Mostra cálculo na UI (se tiver):
   - **Principal**: 10,000 USDC (100% returned)
   - **Upside Share**: 1,200 USDC (10% de 12,000 USDC = 60% de 20k)
   - **Total Payout**: 11,200 USDC
5. Aprova transação

**Narração (durante claim)**:
> "I receive 11,200 USDC: my full 10,000 principal back, plus 1,200 in profit. A 12% return in 6 months."

**Visual**: Switch para Solscan (transação `distribute_proceeds`)

**Actions**:
6. Mostra transação no Solscan
7. Destaca **payout** de 11,200 USDC do vault para investor

**Narração**:
> "On-chain proof: 11,200 USDC transferred from the vault to my wallet."

**Visual**: Volta ao frontend (operator wallet)

**Narração**:
> "Now the operator claims their performance fee. The operator gets 20% of the upside — that's 4,000 USDC — plus their original 5,000 skin-in-game back."

**Actions**:
8. Conecta wallet do operador
9. Clica em **Claim Operator Performance** (ou similar)
10. Mostra cálculo (se tiver):
    - **Skin-in-Game Returned**: 5,000 USDC (os 5% depositados inicialmente)
    - **Performance Fee**: 4,000 USDC (20% de 20k upside)
    - **Total**: 9,000 USDC
11. Aprova transação

**Narração**:
> "Operator receives 9,000 USDC: the original 5,000 skin deposit back, plus 4,000 performance. The remaining 20% upside — 4,000 USDC — goes to the platform treasury."

**Timing**: ~40 segundos

---

### **[2:30 - 3:00] CLOSING — Key Takeaways + Call to Action (30s)**

**Visual**: Slide de fechamento ou dashboard overview mostrando pool concluído

**Narração**:
> "Let's recap what we just proved:
>
> **One**: Skin-in-the-game is enforced on-chain. The operator can't raise funds without depositing 5% first.
>
> **Two**: Every step is verifiable on Solscan — no black boxes.
>
> **Three**: Profit distribution is automated and fair: 60% to investors, 20% operator performance, 20% platform.
>
> **Four**: This all runs on Solana — instant settlement, near-zero transaction costs.
>
> BlockFlip makes real-estate flipping accessible, transparent, and cryptographically secure. Our testnet is live now. Mainnet launches Q3 2026.
>
> Thank you for watching. Check out our deck and repo at the links below."

**Visual**: Slide final com:
- **Program ID**: `8HJ9DeCCPsvadP45ironJLS2uq7WVa6wfrBLf3VxAE5T`
- **Devnet Explorer**: Solscan link
- **Frontend**: Vercel URL
- **GitHub**: Repo link
- **Contact**: Email ou Twitter

**Timing**: ~30 segundos

---

## Post-Production Checklist

### Editing Tasks
- [ ] Cortar silêncios longos (manter ritmo em ~120-140 wpm)
- [ ] Adicionar zoom-ins quando mostrar Solscan (highlight vault balance, tx hash)
- [ ] Overlay de texto para números-chave:
  - "5% Skin-in-Game Deposited"
  - "Investor Return: 12%"
  - "60/20/20 Split Enforced On-Chain"
- [ ] Música de fundo (low-volume, sem copyright — sugestões: Epidemic Sound, Artlist)
- [ ] Lower third com seu nome/cargo no início
- [ ] Call-to-action overlay final com QR code ou link encurtado

### Technical Quality
- [ ] Resolução: 1080p mínimo (4K se possível)
- [ ] Áudio limpo, sem ruído de fundo
- [ ] Narração clara (grave em ambiente silencioso, use mic USB decente)
- [ ] Legendas/Closed Captions (YouTube auto-generate + manual review)

### Distribution
- [ ] Upload no YouTube (título: "BlockFlip — Solana RWA Protocol Demo | Colosseum 2026")
- [ ] Upload no Twitter/X (versão curta de 60s se possível)
- [ ] Embed no README do GitHub
- [ ] Enviar link no formulário de submissão do Colosseum

---

## Variações e Contingências

### Se o tempo estourar (>3min):
- Remova a seção de milestone tracking (1:20-1:50) e pule direto para completion
- Narração condensada: "After 6 months of tracked renovation, the property sells for 120k. Let's distribute profits."

### Se a transação falhar ao vivo:
- Tenha um backup screen recording do fluxo completo (sem narração) para substituir
- OU: mostre um Solscan link pré-pronto e narre sobre ele

### Se não tiver USDC devnet:
- Use SOL nativo (ajuste narração para "100 SOL" em vez de "100,000 USDC")
- OU: crie um mock SPL token no devnet antes de gravar

---

## Script Alternativo (Narração em Português Brasileiro)

Se preferir gravar em PT-BR para audiência brasileira (e adicionar legendas em inglês):

**[0:00 - 0:20] Abertura**:
> "BlockFlip é um protocolo RWA na Solana para tokenizar flips imobiliários no Brasil. Nossa inovação core é **skin-in-the-game on-chain**: antes de aceitar capital de investidores, operadores DEVEM depositar 5% da meta de captação num vault PDA. Isso cria prova criptográfica de alinhamento — se o flip falha, o operador perde primeiro.
>
> Hoje vou demonstrar o ciclo completo: operador cria pool, deposita skin-in-the-game, investidor participa, e rastreamos tudo on-chain com transparência total."

*(Continue adaptando o resto do script mantendo timings)*

---

## Recursos Adicionais

### Documentação de Referência
- **Anchor Program**: `anchor/programs/blockflip/src/lib.rs`
- **Frontend**: `src/app/[locale]/` (Next.js 15)
- **Solscan Devnet**: https://solscan.io/?cluster=devnet

### Assets para Overlay (criar antes de gravar)
1. Logo BlockFlip (PNG transparente, 200x200px)
2. Ícone de "checkmark" verde para skin-in-game verified
3. Gráfico de pizza 60/20/20 (criar no Figma/Canva)
4. QR code para GitHub repo

### Ferramentas Recomendadas
- **Screen Recording**: OBS Studio (grátis), Loom (pago), ScreenFlow (Mac)
- **Editing**: DaVinci Resolve (grátis), Adobe Premiere (pago)
- **Audio**: Audacity (grátis) para limpar ruído
- **Thumbnails**: Canva (templates de tech demo)

---

## Contact & Support
- **Issues técnicas**: GitHub Issues no repo blockflip
- **Dúvidas de produção**: [seu email ou Discord]

---

**Boa sorte com a gravação! 🎬🚀**
