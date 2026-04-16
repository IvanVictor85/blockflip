# PRD - BlockFlip

## Visão Geral
BlockFlip é um protocolo de Real World Assets (RWA) na blockchain Solana focado em Property Flipping: arremate judicial → reforma ágil → venda premium. Investidores aportam USDC em frações de imóveis tokenizados e recebem retorno proporcional ao lucro na venda. O ciclo alvo é de ROI de 20-30% em menos de 6 meses.

## Objetivos
- **Objetivo principal:** Democratizar o acesso ao mercado imobiliário de alto retorno via tokenização on-chain com transparência total
- **Objetivos secundários:**
  - Atrair investidores Web2 e VCs com UI "Brutal Clarity" (Brex/Ramp style)
  - Competir globalmente no Colosseum Hackathon (Solana)
  - Estabelecer padrão de transparência superior aos players existentes (ex: Rentakia)

## Público-Alvo
- **Primário:** Investidores Web2 sem experiência em crypto buscando diversificação imobiliária
- **Secundário:** VCs e family offices interessados em RWA tokenizados
- **Terciário:** Investidores cripto nativos buscando exposição a ativos reais com yield previsível

## Funcionalidades Core
1. **Marketplace de Imóveis** — Grid filtrado por status (Arremate / Em Reforma / À Venda) com dados financeiros em tempo real
2. **Proof of Build** — Timeline de marcos de obra com evidências on-chain (hash de fotos, documentos, vídeos)
3. **Transparência Blockchain** — Smart contract viewer, ícone SPE verificado, documentos auditáveis (Edital, Matrícula, Cronograma)
4. **Captação USDC** — Barra de progresso de funding, min. investimento por token
5. **Unit Economics Visual** — [Compra Baixa] + [Reforma Ágil] = [Saída Premium] explicado sem jargão

## Requisitos Técnicos
- **Framework:** Next.js 16.x com App Router
- **UI:** Shadcn/ui + Tailwind CSS v4 + Dark Mode
- **Linguagem:** TypeScript strict mode
- **Tema:** Dark com Solana Green (#14F195)
- **Autenticação:** Wallet Solana (Phantom, Backpack, Solflare) via @solana/wallet-adapter
- **Dados:** Mock data (migração para Solana mainnet na v2)
- **Deploy:** Vercel

## Requisitos de Segurança (OWASP Top 10)
1. **Broken Access Control:** Validação de permissões antes de ações de investimento, RBAC para operações admin
2. **Cryptographic Failures:** HTTPS obrigatório, dados sensíveis nunca expostos em logs ou client
3. **Injection:** Validação de todos os inputs com Zod, sanitização antes de render
4. **Insecure Design:** Princípio do menor privilégio, revisão de superfície de ataque
5. **Security Misconfiguration:** Headers OWASP via middleware, CORS configurado
6. **Vulnerable Components:** Auditoria regular (`npm audit`), dependências atualizadas
7. **Authentication Failures:** Wallet signature verification, sem armazenamento de chaves privadas
8. **Data Integrity Failures:** Hashes on-chain para documentos, imutabilidade garantida pela Solana
9. **Security Logging:** Logs de ações críticas (investimentos, conexões de wallet)
10. **SSRF:** Whitelist de URLs externas (apenas explorer.solana.com, ipfs.io)

## Métricas de Sucesso
- **Performance:** LCP < 2.5s, FID < 100ms
- **Segurança:** 0 vulnerabilidades críticas no `npm audit`
- **UX:** Investidor Web2 consegue entender a proposta em < 30 segundos
- **Hackathon:** Top 1 Global no Colosseum Hackathon 2025
