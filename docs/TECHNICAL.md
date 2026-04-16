# Documentação Técnica - BlockFlip

## Arquitetura

### Frontend
- **Framework:** Next.js 16.x com App Router
- **Estilização:** Tailwind CSS v4 + Shadcn/ui (tema customizado Solana Green #14F195)
- **Estado:** React useState/Context (Zustand para estado global quando necessário)
- **Validação:** Zod + React Hook Form
- **Icons:** Lucide React

### Blockchain
- **Rede:** Solana (mainnet / devnet para testes)
- **Wallet Adapter:** @solana/wallet-adapter-react
- **RPC:** @solana/web3.js
- **Tokens:** SPL Token standard (USDC)

### Backend / API
- **API Routes:** Next.js Route Handlers (`/api/v1/`)
- **Validação:** Middleware com Zod
- **Autenticação:** Wallet signature (sem senha)
- **Rate Limiting:** A implementar com upstash/ratelimit
- **Dados:** Mock data (src/lib/mock-data/) → migrar para on-chain na v2

### Segurança
- CSP Headers via middleware.ts
- CORS com whitelist explícita
- Input sanitization com Zod
- Nunca armazenar chaves privadas ou seeds
- XSS protection via headers + sanitização

## Estrutura de Pastas

```
src/
├── app/                    # Rotas e páginas (App Router)
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/v1/            # Route handlers
├── components/             # Componentes reutilizáveis
│   ├── ui/                # Shadcn/ui components
│   ├── asset-card.tsx
│   ├── asset-marketplace.tsx
│   ├── hero.tsx
│   ├── navbar.tsx
│   ├── proof-of-build.tsx
│   ├── property-documents.tsx
│   ├── unit-economics.tsx
│   └── footer.tsx
├── lib/                   # Utilidades e configurações
│   ├── utils.ts           # cn() e helpers gerais
│   ├── security/          # Funções de segurança
│   │   └── index.ts
│   ├── mock-data/         # Dados mockados
│   │   └── index.ts
│   └── validations/       # Schemas Zod
│       └── index.ts
├── data/                  # Dados estáticos e mocks
│   └── mock-assets.ts
├── hooks/                 # Custom hooks
├── types/                 # TypeScript types
│   └── index.ts
└── middleware.ts          # Security middleware
```

## Padrões de Código

### Convenções de Nomenclatura
- **Componentes:** PascalCase (`AssetCard`, `ProofOfBuild`)
- **Funções utilitárias:** camelCase (`formatCurrency`, `simulateDelay`)
- **Constantes:** UPPER_SNAKE_CASE (`SOLANA_EXPLORER_URL`)
- **Arquivos:** kebab-case (`asset-card.tsx`, `mock-assets.ts`)
- **Tipos/Interfaces:** PascalCase (`Asset`, `PropertyDocument`)

### Regras TypeScript
- Strict mode habilitado
- Sem `any` implícito
- Tipos explícitos em funções públicas
- Interfaces para objetos complexos, type para unions/aliases

## APIs e Endpoints

### Padrões de API
- Versionamento: `/api/v1/`
- Autenticação: Wallet signature (Bearer token futuro)
- Rate limiting: 100 req/min por IP
- CORS: Configurado por endpoint

### Endpoints Planejados (v1)
```
GET  /api/v1/assets          # Listar imóveis
GET  /api/v1/assets/:id      # Detalhe do imóvel
POST /api/v1/invest          # Registrar intenção de investimento
GET  /api/v1/portfolio/:wallet # Portfolio do investidor
```

## Mock Data Strategy
- Dados em `src/lib/mock-data/` e `src/data/mock-assets.ts`
- Simular network delays com `simulateDelay()`
- Estrutura idêntica ao schema on-chain futuro
- 4 imóveis de SP mockados: Pinheiros, Vila Madalena, Moema, Consolação

## Security Headers (OWASP)

```typescript
// Configurados no middleware.ts
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains (prod)
Content-Security-Policy: default-src 'self'; ...
```

## Checklist Antes de Commit
- [ ] `npm run type-check` sem erros
- [ ] `npm run lint` sem warnings críticos
- [ ] `npm run build` bem-sucedido
- [ ] Sem dados sensíveis expostos (chaves, seeds, PII)
- [ ] Documentação atualizada se API mudou
- [ ] Headers de segurança intactos no middleware
